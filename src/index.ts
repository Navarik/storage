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

export * from './types'

type StorageConfig<B extends object, M extends object> = {
  // Adapters - override when changing underlying technology
  changelog?: Changelog<B, M>
  index?: SearchIndex<B, M>
  state?: State<B, M>

  // Extensions - override when adding new rules/capacities
  schemaRegistry?: SchemaRegistry
  accessControl?: AccessControlAdapter<B, M>
  logger?: Logger

  // Built-in schemas for entity body and metadata
  meta?: Dictionary<SchemaField>
  schema?: Array<CanonicalSchema>

  // Built-in entities if any
  data?: Array<EntityData<B, M>>

  // Configuration
  cacheSize?: number
}

const none = '00000000-0000-0000-0000-000000000000'

export class Storage<BodyType extends object, MetaType extends object> {
  private isInitializing: boolean
  private ddl: SchemaRegistry
  private metaDdl: SchemaRegistry
  private accessControl: AccessControlAdapter<BodyType, MetaType>
  private currentState: State<BodyType, MetaType>
  private searchIndex: SearchIndex<BodyType, MetaType>
  private changelog: Changelog<BodyType, MetaType>
  private observers: Array<Observer<BodyType, MetaType>>
  private entityFactory: EntityFactory<BodyType, MetaType>
  private changeEventFactory: ChangeEventFactory<BodyType, MetaType>
  private transactionManager: TransactionManager<CanonicalEntity<BodyType, MetaType>>
  private logger: Logger
  private healthStats = {
    upSince: new Date(),
    totalChangesProduced: 0,
    totalChangesReceived: 0,
    totalIdLookups: 0,
    totalSearchQueries: 0,
    totalProcessingErrors: 0
  }

  constructor(config: StorageConfig<BodyType, MetaType> = {}) {
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

    this.transactionManager = new TransactionManager()
    this.accessControl = accessControl || new DefaultAccessControl<BodyType, MetaType>()
    this.changelog = changelog || new DefaultChangelog(staticChangelog)
    this.searchIndex = index || new NeDbSearchIndex<BodyType, MetaType>({ logger: this.logger })
    this.currentState = state || new LocalState<BodyType, MetaType>({
      size: config.cacheSize || 5000000,
      searchIndex: this.searchIndex
    })

    this.changelog.observe(x => this.onChange(x))
  }

  private async updateCurrentState(event: ChangeEvent<BodyType, MetaType>) {
    if (event.action === 'delete') {
      await this.currentState.delete(event.entity.id)
    } else {
      await this.currentState.put(event.entity)
    }
  }

  private async notifyObservers(event: ChangeEvent<BodyType, MetaType>) {
    if (!this.isInitializing) {
      await Promise.all(this.observers.map(f => f(event)))
    }
  }

  private async onChange(event: ChangeEvent<BodyType, MetaType>) {
    this.healthStats.totalChangesReceived++

    try {
      this.logger.debug({ component: "Storage" }, `Received change event for entity: ${event.entity.id}`)

      await this.updateCurrentState(event)
      await this.notifyObservers(event)

      const entityWithAcl = await this.accessControl.attachTerms(event.entity)
      await this.searchIndex.update(event.action, entityWithAcl, event.schema, this.metaDdl.describe('metadata'), event.entity.schema)

      this.transactionManager.commit(event.entity.version_id, event.entity)
    } catch (error) {
      this.healthStats.totalProcessingErrors++
      this.logger.error({ component: "Storage", stack: error.stack }, `Error processing change event: ${error.message}`)
      this.transactionManager.reject(event.entity.version_id, error)
    }
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

  validate(entity: EntityData<BodyType, MetaType>): ValidationResponse {
    if (!entity.type) {
      return { isValid: false, message: "Type must be provided" }
    }

    return this.ddl.validate(entity.type, entity.body)
  }

  isValid(entity: EntityData<BodyType, MetaType>): boolean {
    if (!entity.type) {
      return false
    }

    return this.ddl.validate(entity.type, entity.body).isValid
  }

  async get(id: UUID, user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++

    const entity = await this.currentState.get(id)
    const access = await this.accessControl.check(user, 'read', entity)

    if (!access.granted) {
      this.logger.trace(access.explanation)
      return
    }

    return entity
  }

  async find(query: SearchQuery = {}, options: SearchOptions = {}, user: UUID = none): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++

    const aclTerms = await this.accessControl.getQuery(user, 'read')
    const collection = await this.searchIndex.find({ ...query, ...aclTerms }, options)

    return collection
  }

  async count(query: SearchQuery = {}, user: UUID = none): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, 'read')
    const count = this.searchIndex.count({ ...query, ...aclTerms })

    return count
  }

  async create(entity: EntityData<BodyType, MetaType>, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType>> {
    const canonical = this.entityFactory.create(entity, user)
    const changeEvent = this.changeEventFactory.create("create", canonical, commitMessage)
    const transaction = this.transactionManager.start(changeEvent.entity.version_id, 1)
    await this.changelog.write(changeEvent)

    this.healthStats.totalChangesProduced++

    return transaction as Promise<CanonicalEntity<BodyType, MetaType>>
  }

  async update(entity: EntityPatch<BodyType, MetaType>, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType>> {
    const previous = await this.get(entity.id, user)
    if (!previous) {
      throw new ConflictError(`[Storage] Update failed: can't find entity ${entity.id}`)
    }

    const canonical = this.entityFactory.merge(previous, entity, user)
    const changeEvent = this.changeEventFactory.create("update", canonical, commitMessage)
    const transaction = this.transactionManager.start(changeEvent.entity.version_id, 1)
    await this.changelog.write(changeEvent)

    this.healthStats.totalChangesProduced++

    return transaction as Promise<CanonicalEntity<BodyType, MetaType>>
  }

  async delete(id: UUID, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const entity = await this.get(id, user)
    if (!entity) {
      return undefined
    }

    const changeEvent = this.changeEventFactory.create("delete", entity, commitMessage)
    const transaction = this.transactionManager.start(entity.version_id, 1)
    await this.changelog.write(changeEvent)

    this.healthStats.totalChangesProduced++

    return transaction as Promise<CanonicalEntity<BodyType, MetaType>>
  }

  observe(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
