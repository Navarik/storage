import { Map, Logger } from '@navarik/types'
import { CoreDdl, CanonicalSchema, SchemaField, ValidationResponse } from '@navarik/core-ddl'
import { StorageInterface, AccessControlAdapter, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, ChangeEvent, EntityPatch, EntityData, StorageConfig } from './types'
import { NeDbSearchIndex } from './adapters/nedb-search-index/index'
import { DefaultAccessControl } from './adapters/default-access-control'
import { DefaultChangelogAdapter } from './adapters/default-changelog'
import { State } from './state'
import { ChangeEventFactory } from './change-event-factory'
import { EntityFactory } from "./entity-factory"
import { Changelog } from "./changelog"
import { defaultLogger } from "./adapters/default-logger"
import { ConflictError } from './errors/conflict-error'
import { AccessError } from './errors/access-error'
import { QueryParser } from './query-parser'

export * from './types'

const nobody = '00000000-0000-0000-0000-000000000000'

export class Storage<MetaType extends object> implements StorageInterface<MetaType> {
  private staticData: Array<ChangeEvent<any, MetaType>>
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private queryParser: QueryParser
  private accessControl: AccessControlAdapter<MetaType>
  private currentState: State<MetaType>
  private searchIndex: SearchIndex<MetaType>
  private changelog: Changelog<MetaType>
  private observers: Array<Observer<any, MetaType>>
  private entityFactory: EntityFactory<MetaType>
  private changeEventFactory: ChangeEventFactory<MetaType>
  private logger: Logger
  private healthStats = {
    upSince: new Date(),
    totalIdLookups: 0,
    totalSearchQueries: 0
  }
  private isUp: boolean


  constructor(config: StorageConfig<MetaType> = {}) {
    const { accessControl, changelog, index, schemaRegistry, meta = {}, schema = [], data = [], cacheSize = 5000000, logger } = config

    this.isUp = false
    this.logger = logger || defaultLogger
    this.logger.debug({ component: "Storage" }, `Initializing storage (cache size: ${cacheSize}, static schemas: ${schema.length}, static data: ${data.length})`)

    this.observers = []
    this.ddl = new CoreDdl({
      registry: schemaRegistry
    })
    this.metaDdl = new CoreDdl({
      schema: [{
        type: 'metadata',
        fields: <Map<SchemaField>>meta
      }]
    })
    this.queryParser = new QueryParser()

    this.accessControl = accessControl || new DefaultAccessControl()
    this.searchIndex = index || new NeDbSearchIndex({ logger: this.logger })

    this.currentState = new State({
      cacheSize,
      searchIndex: this.searchIndex
    })

    this.changelog = new Changelog<MetaType>({
      adapter: changelog || new DefaultChangelogAdapter(),
      logger: this.logger,
      accessControl: this.accessControl,
      observer: this.onChange.bind(this)
    })

    this.entityFactory = new EntityFactory({
      ddl: this.ddl,
      metaDdl: this.metaDdl,
      metaType: 'metadata'
    })

    this.changeEventFactory = new ChangeEventFactory({
      ddl: this.ddl
    })

    // Static schema definitions if there is any

    schema.forEach(s => this.ddl.define(s))

    // Static data is used primarily for automated tests
    this.staticData = data.map(document => this.changeEventFactory.create(
      "create",
      this.entityFactory.create(document, nobody),
      "Static data loaded"
    ))
  }

  private async updateState<B extends object>(event: ChangeEvent<B, MetaType>) {
    this.logger.debug({ component: "Storage" }, `Processing '${event.action}' change event event for entity ${event.entity.id}`)

    if (event.action === 'delete') {
      await this.currentState.delete(event.entity.id)
    } else {
      await this.currentState.put(event.entity)
    }

    const entityWithAcl = await this.accessControl.attachTerms(event.entity)
    await this.searchIndex.update(event.action, entityWithAcl, event.schema, this.metaDdl.describe('metadata'))
  }

  private async onChange<B extends object>(event: ChangeEvent<B, MetaType>) {
    await this.updateState(event)

    if (this.isUp) {
      this.logger.debug({ component: "Storage" }, `Notifying observers on change event for entity ${event.entity.id}`)
      this.observers.forEach(async (observer) => {
        try {
          await observer(event)
        } catch (error: any) {
          this.logger.error({ component: "Storage", stack: error.stack }, `Error notifying observer of change event: ${error.message}`)
        }
      })
    }
  }

  async up() {
    await this.searchIndex.up()
    for (const staticEntity of this.staticData) {
      await this.updateState(staticEntity)
    }

    if (!(await this.searchIndex.isClean())) {
      await this.changelog.readAll()
    } else {
      await this.changelog.up()
    }

    this.isUp = true
  }

  async down() {
    await this.changelog.down()
    await this.searchIndex.down()

    this.isUp = false
  }

  async isHealthy() {
    if (!this.isUp) {
      return false
    }

    const [changelogHealth, indexHealth, stateHealth] = await Promise.all([
      this.changelog.isHealthy(),
      this.searchIndex.isHealthy(),
      this.currentState.isHealthy()
    ])

    return changelogHealth && indexHealth && stateHealth
  }

  async stats() {
    const cacheStats = await this.currentState.stats()
    const changelogStats = await this.changelog.stats()

    return {
      ...this.healthStats,
      ...cacheStats,
      ...changelogStats
    }
  }

  types() {
    return this.ddl.types()
  }

  describe(type: string) {
    return this.ddl.describe(type)
  }

  define(schema: CanonicalSchema) {
    return this.ddl.define(schema)
  }

  async has(id: UUID): Promise<boolean> {
    const entityExists = await this.currentState.has(id)

    return entityExists
  }

  async get<BodyType extends object>(id: UUID, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++

    const entity = await this.currentState.get<BodyType>(id)
    if (!entity) {
      return undefined
    }

    const access = await this.accessControl.check(user, 'read', entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    return entity
  }

  async find<BodyType extends object>(query: object, options: SearchOptions = {}, user: UUID = nobody): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++

    const aclTerms = await this.accessControl.getQuery(user, 'search')
    const queryTerms = this.queryParser.parse(query)
    const combinedQuery = this.queryParser.merge("and", [aclTerms, queryTerms])

    const collection = await this.searchIndex.find<BodyType>(combinedQuery, options)

    return collection
  }

  async count(query: object, user: UUID = nobody): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, 'search')
    const queryTerms = this.queryParser.parse(query)
    const combinedQuery = this.queryParser.merge("and", [aclTerms, queryTerms])

    const count = this.searchIndex.count(combinedQuery)

    return count
  }

  validate<BodyType extends object>(entity: EntityData<BodyType, MetaType>): ValidationResponse {
    if (!entity.type) {
      return { isValid: false, message: "Type must be provided" }
    }

    return this.ddl.validate(entity.type, entity.body)
  }

  async create<BodyType extends object>(data: EntityData<BodyType, MetaType>, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    const entity = this.entityFactory.create(data, user)

    const changeEvent = this.changeEventFactory.create("create", entity, commitMessage)

    return this.changelog.requestChange(changeEvent)
  }

  async update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    const previous = await this.currentState.get(data.id)
    if (!previous) {
      throw new ConflictError(`[Storage] Update failed: can't find entity ${data.id}`)
    }

    const entity = this.entityFactory.merge(previous, data, user)
    const changeEvent = this.changeEventFactory.create("update", entity, commitMessage)

    return this.changelog.requestChange(changeEvent)
  }

  async delete<BodyType extends object>(id: UUID, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const previous = await this.currentState.get<BodyType>(id)
    if (!previous) {
      return undefined
    }

    const entity = this.entityFactory.remove<BodyType>(previous, user)
    const changeEvent = this.changeEventFactory.create<BodyType>("delete", entity, commitMessage)

    return this.changelog.requestChange(changeEvent)
  }

  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
