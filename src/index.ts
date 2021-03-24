import { Dictionary, Map, Logger } from '@navarik/types'
import { CoreDdl, CanonicalSchema, SchemaField, ValidationResponse } from '@navarik/core-ddl'
import { TransactionManager } from "@navarik/transaction-manager"
import { AccessControlAdapter, Changelog, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, EntityPatch, State, EntityData, SchemaRegistry } from './types'
import { NeDbSearchIndex } from './adapters/nedb/ne-db-search-index'
import { DefaultAccessControl } from './adapters/default-access-control'
import { DefaultChangelog } from './adapters/default-changelog'
import { ChangeEventFactory } from './change-event-factory'
import { EntityFactory } from "./entity-factory"
import { LocalState } from './adapters/local-state'
import { defaultLogger } from "./adapters/default-logger"
import { ConflictError } from './errors/conflict-error'
import { AccessError } from './errors/access-error'

export * from './types'

interface StorageConfig<M extends object> {
  // Adapters - override when changing underlying technology
  changelog?: Changelog<M>
  state?: State<M>
  index?: SearchIndex<M>

  // Extensions - override when adding new rules/capacities
  schemaRegistry?: SchemaRegistry
  accessControl?: AccessControlAdapter
  logger?: Logger

  // Built-in schemas for entity body and metadata
  meta?: Dictionary<SchemaField>
  schema?: Array<CanonicalSchema>

  // Built-in entities if any
  data?: Array<EntityData<any, M>>

  // Configuration
  cacheSize?: number
}

const none = '00000000-0000-0000-0000-000000000000'

export class Storage<MetaType extends object> {
  private isInitializing: boolean
  private ddl: SchemaRegistry
  private metaDdl: SchemaRegistry
  private accessControl: AccessControlAdapter
  private currentState: State<MetaType>
  private searchIndex: SearchIndex<MetaType>
  private changelog: Changelog<MetaType>
  private observers: Array<Observer<any, MetaType>>
  private entityFactory: EntityFactory<MetaType>
  private changeEventFactory: ChangeEventFactory<MetaType>
  private transactionManager: TransactionManager<CanonicalEntity<any, MetaType>>
  private logger: Logger
  private healthStats = {
    upSince: new Date(),
    totalChangesProduced: 0,
    totalChangesReceived: 0,
    totalIdLookups: 0,
    totalSearchQueries: 0,
    totalProcessingErrors: 0
  }

  constructor(config: StorageConfig<MetaType> = {}) {
    const { accessControl, changelog, index, state, schemaRegistry, meta = {}, schema = [], data = [], logger } = config
    this.isInitializing = true

    this.logger = logger || defaultLogger
    this.logger.info({ component: "Storage" }, "Initializing storage")

    this.observers = []
    this.ddl = schemaRegistry || new CoreDdl({})
    this.metaDdl = new CoreDdl({
      schema: [{
        type: 'metadata',
        fields: <Map<SchemaField>>meta
      }]
    })

    this.transactionManager = new TransactionManager()
    this.accessControl = accessControl || new DefaultAccessControl()
    this.searchIndex = index || new NeDbSearchIndex({ logger: this.logger })
    this.currentState = state || new LocalState({
      size: config.cacheSize || 5000000,
      searchIndex: this.searchIndex
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
    const staticChangelog = []
    for (const document of data) {
      const entity = this.entityFactory.create(document, none)
      const changeEvent = this.changeEventFactory.create('create', entity, "Static data loaded")
      staticChangelog.push(changeEvent)
    }

    this.changelog = changelog || new DefaultChangelog(staticChangelog)

    this.changelog.observe(x => this.onChange(x))
  }

  private async updateCurrentState<B extends object>(event: ChangeEvent<B, MetaType>) {
    if (event.action === 'delete') {
      await this.currentState.delete(event.entity.id)
    } else {
      await this.currentState.put(event.entity)
    }
  }

  private notifyObservers(event: ChangeEvent<any, MetaType>) {
    if (!this.isInitializing) {
      this.observers.forEach(async (observer) => {
        try {
          await observer(event)
        } catch (error) {
          this.logger.error({ component: "Storage", stack: error.stack }, `Error notifying observer of change event: ${error.message}`)
        }
      })
    }
  }

  private async onChange<B extends object>(event: ChangeEvent<B, MetaType>) {
    this.healthStats.totalChangesReceived++

    try {
      this.logger.debug({ component: "Storage" }, `Received change event for entity: ${event.entity.id}`)

      await this.updateCurrentState(event)

      const entityWithAcl = await this.accessControl.attachTerms(event.entity)
      await this.searchIndex.update(event.action, entityWithAcl, event.schema, this.metaDdl.describe('metadata'))

      this.logger.debug({ component: "Storage" }, `Change event for entity ${event.entity.id} is processed. Notifying observers.`)

      if (!this.transactionManager.commit(event.id, event.entity)) {
        this.logger.debug({ component: "Storage" }, `Can't find transaction ${event.id}`)
      }

      this.notifyObservers(event)
    } catch (error) {
      this.healthStats.totalProcessingErrors++
      this.logger.error({ component: "Storage", stack: error.stack }, `Error processing change event: ${error.message}`)

      if (!this.transactionManager.reject(event.id, error)) {
        this.logger.debug({ component: "Storage" }, `Can't find transaction ${event.id}`)
      }
    }
  }

  private async requestChange<B extends object>(change: ChangeEvent<B, MetaType>) {
    const access = await this.accessControl.check(change.user, 'write', change.entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    const transaction = this.transactionManager.start(change.id, 1)
    await this.changelog.write(change)

    this.healthStats.totalChangesProduced++

    return <Promise<CanonicalEntity<B, MetaType>>>transaction
  }

  async up() {
    await this.searchIndex.up()

    if (!(await this.searchIndex.isClean())) {
      await this.changelog.readAll()
    } else {
      await this.changelog.up()
    }

    this.isInitializing = false
  }

  async down() {
    await this.changelog.down()
    await this.searchIndex.down()
  }

  async isHealthy() {
    const [changelogHealth, indexHealth, stateHealth] = await Promise.all([
      this.changelog.isHealthy(),
      this.searchIndex.isHealthy(),
      this.currentState.isHealthy()
    ])

    return changelogHealth && indexHealth && stateHealth
  }

  async stats() {
    const cacheStats = await this.currentState.stats()

    return {
      ...this.healthStats,
      ...cacheStats
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

  validate<BodyType extends object>(entity: EntityData<BodyType, MetaType>): ValidationResponse {
    if (!entity.type) {
      return { isValid: false, message: "Type must be provided" }
    }

    return this.ddl.validate(entity.type, entity.body)
  }

  isValid<BodyType extends object>(entity: EntityData<BodyType, MetaType>): boolean {
    if (!entity.type) {
      return false
    }

    return this.ddl.validate(entity.type, entity.body).isValid
  }

  async has(id: UUID): Promise<boolean> {
    const entityExists = await this.currentState.has(id)

    return entityExists
  }

  async get<BodyType extends object>(id: UUID, user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++

    const entity = await this.currentState.get<BodyType>(id)

    const access = await this.accessControl.check(user, 'read', entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    return entity
  }

  async find<BodyType extends object>(query: SearchQuery = {}, options: SearchOptions = {}, user: UUID = none): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++

    const aclTerms = await this.accessControl.getQuery(user, 'search')
    const collection = await this.searchIndex.find<BodyType>({ ...query, ...aclTerms }, options)

    return collection
  }

  async count(query: SearchQuery = {}, user: UUID = none): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, 'search')
    const count = this.searchIndex.count({ ...query, ...aclTerms })

    return count
  }

  async create<BodyType extends object>(data: EntityData<BodyType, MetaType>, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType>> {
    const entity = this.entityFactory.create(data, user)

    const changeEvent = this.changeEventFactory.create("create", entity, commitMessage)

    return this.requestChange(changeEvent)
  }

  async update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType>> {
    const previous = await this.currentState.get(data.id)
    if (!previous) {
      throw new ConflictError(`[Storage] Update failed: can't find entity ${data.id}`)
    }

    const entity = this.entityFactory.merge(previous, data, user)
    const changeEvent = this.changeEventFactory.create("update", entity, commitMessage)

    return this.requestChange(changeEvent)
  }

  async delete<BodyType extends object>(id: UUID, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const previous = await this.currentState.get<BodyType>(id)
    if (!previous) {
      return undefined
    }

    // Deleted entity doesn't change
    const entity = this.entityFactory.merge<BodyType>(previous, previous, user)
    const changeEvent = this.changeEventFactory.create<BodyType>("delete", entity, commitMessage)

    return this.requestChange(changeEvent)
  }

  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
