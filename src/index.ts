import { Dictionary, Map, Logger } from '@navarik/types'
import { CoreDdl, SchemaRegistryAdapter, CanonicalSchema, SchemaField, ValidationResponse } from '@navarik/core-ddl'
import { TransactionManager } from "@navarik/transaction-manager"
import { AccessControlAdapter, Changelog, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, PartialEntity, State, IdGenerator, EntityData } from './types'
import { NeDbSearchIndex } from './adapters/nedb/ne-db-search-index'
import { DefaultAccessControl } from './adapters/default-access-control'
import { DefaultChangelog } from './adapters/default-changelog'
import { ChangeEventFactory } from './change-event-factory'
import { EntityFactory } from "./entity-factory"
import { LocalState } from './adapters/local-state'
import { defaultLogger } from "./adapters/default-logger"

export * from './types'

type StorageConfig<B extends object, M extends object> = {
  // Adapters - override when changing underlying technology
  changelog?: Changelog<B, M>
  index?: SearchIndex<B, M>
  state?: State<B, M>

  // Extensions - override when adding new rules/capacities
  schemaRegistry?: SchemaRegistryAdapter
  accessControl?: AccessControlAdapter<B, M>
  idGenerators?: Dictionary<IdGenerator>
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
  private ddl: CoreDdl
  private metaDdl: CoreDdl
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
    changesProduced: 0,
    changesReceived: 0,
    idLookups: 0,
    searchQueries: 0
  }

  constructor(config: StorageConfig<BodyType, MetaType> = {}) {
    const { accessControl, changelog, index, state, schemaRegistry, meta = {}, schema = [], data = [], logger, idGenerators = {} } = config
    this.isInitializing = true

    this.logger = logger || defaultLogger

    this.observers = []
    this.ddl = new CoreDdl({ schema, registry: schemaRegistry })
    this.metaDdl = new CoreDdl({
      schema: [{
        type: 'metadata',
        fields: <Map<SchemaField>>meta
      }]
    })

    this.entityFactory = new EntityFactory({
      generators: idGenerators,
      ddl: this.ddl,
      metaDdl: this.metaDdl,
      metaType: 'metadata'
    })

    this.changeEventFactory = new ChangeEventFactory({
      ddl: this.ddl
    })

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

  private async onChange(event: ChangeEvent<BodyType, MetaType>) {
    this.healthStats.changesReceived++

    const entityWithAcl = await this.accessControl.attachTerms(event.entity)

    // Update current state
    if (event.action === 'delete') {
      await this.currentState.delete(event.entity.id)
    } else {
      await this.currentState.put(entityWithAcl)
    }

    // Notify observers
    if (!this.isInitializing) {
      await Promise.all(this.observers.map(f => f(event)))
    }

    // Update search index
    await this.searchIndex.update(event.action, entityWithAcl, event.schema, this.metaDdl.describe('metadata'))

    // Close transaction
    this.transactionManager.commit(event.entity.version_id, event.entity)
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
    return {
      upSince: this.healthStats.upSince.toJSON(),
      totalChangesProduced: this.healthStats.changesProduced,
      totalChangesReceived: this.healthStats.changesReceived,
      totalIdLookups: this.healthStats.idLookups,
      totalSearchQueries: this.healthStats.searchQueries,
      cacheSize: await this.currentState.size,
      cacheUsed: await this.currentState.used
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

  validate(entity: PartialEntity<BodyType, MetaType>): ValidationResponse {
    if (!entity.type) {
      return { isValid: false, message: "Type must be provided" }
    }

    return this.ddl.validate(entity.type, entity.body)
  }

  isValid(entity: PartialEntity<BodyType, MetaType>): boolean {
    if (!entity.type) {
      return false
    }

    return this.ddl.validate(entity.type, entity.body).isValid
  }

  async get(id: UUID, user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.idLookups++

    const entity = await this.currentState.get(id)
    const access = await this.accessControl.check(user, 'read', entity)

    if (!access.granted) {
      this.logger.trace(access.explanation)
      return
    }

    return entity
  }

  async find(query: SearchQuery = {}, options: SearchOptions = {}, user: UUID = none): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.searchQueries++

    const aclTerms = await this.accessControl.getQuery(user, 'read')
    const collection = await this.searchIndex.find({ ...query, ...aclTerms }, options)

    return collection
  }

  async count(query: SearchQuery = {}, user: UUID = none): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, 'read')
    const count = this.searchIndex.count({ ...query, ...aclTerms })

    return count
  }

  async update(entity: PartialEntity<BodyType, MetaType>, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType>> {
    const currentVersion = entity.id ? await this.get(entity.id, user) : undefined
    const previous = currentVersion || this.entityFactory.getEmpty()

    const action = previous.id ? "update" : "create"

    const newEntity = {
      id: entity.id,
      created_by: previous.created_by,
      created_at: previous.created_at,
      type: entity.type || previous.type,
      body: <BodyType>{ ...previous.body, ...(entity.body || {}) },
      meta: <MetaType>{ ...previous.meta, ...(entity.meta || {}) }
    }

    const canonical = this.entityFactory.create(newEntity, user, previous.version_id)
    const changeEvent = this.changeEventFactory.create(action, canonical, commitMessage)
    const transaction = this.transactionManager.start(changeEvent.entity.version_id, 1)
    await this.changelog.write(changeEvent)

    this.healthStats.changesProduced++

    return transaction as Promise<CanonicalEntity<BodyType, MetaType>>
  }

  async updateBulk(collection: Array<PartialEntity<BodyType, MetaType>>, commitMessage: string = "", user: UUID = none): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    return Promise.all(collection.map(entity => this.update(entity, commitMessage, user)))
  }

  async delete(id: UUID, commitMessage: string = "", user: UUID = none): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const entity = await this.get(id, user)
    if (!entity) {
      return undefined
    }

    const changeEvent = this.changeEventFactory.create("delete", entity, commitMessage)

    const transaction = this.transactionManager.start(entity.version_id, 1)
    await this.changelog.write(changeEvent)

    this.healthStats.changesProduced++

    return transaction as Promise<CanonicalEntity<BodyType, MetaType>>
  }

  observe(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
