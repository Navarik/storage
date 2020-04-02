import { Dictionary, Map, Logger } from '@navarik/types'
import { CoreDdl, SchemaRegistryAdapter, CanonicalSchema, SchemaField, ValidationResponse } from '@navarik/core-ddl'
import { AccessControlAdapter, Changelog, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, TypedEntity, IdentifiedEntity, State } from './types'
import { TransactionManager } from "@navarik/transaction-manager"
import { v4 as uuidv4 } from 'uuid'
import { NeDbSearchIndex } from './adapters/nedb/ne-db-search-index'
import { DefaultAccessControl } from './adapters/default-access-control'
import { DefaultChangelog } from './adapters/default-changelog'
import { ChangeEventFactory } from './change-event-factory'
import { LocalState } from './adapters/local-state'
import { defaultLogger } from "./adapters/default-logger"

export * from './types'

type StorageConfig = {
  changelog?: Changelog
  index?: SearchIndex<CanonicalEntity>
  state?: State<CanonicalEntity>
  schemaRegistry?: SchemaRegistryAdapter
  accessControl?: AccessControlAdapter<CanonicalEntity>
  meta?: Dictionary<SchemaField>
  schema?: Array<CanonicalSchema>
  data?: Array<TypedEntity>
  logger?: Logger
}

const none = '00000000-0000-0000-0000-000000000000'

export class Storage {
  private isInitializing: boolean
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private accessControl: AccessControlAdapter<CanonicalEntity>
  private currentState: State<CanonicalEntity>
  private searchIndex: SearchIndex<CanonicalEntity>
  private changelog: Changelog
  private observers: Array<Observer>
  private changeEventFactory: ChangeEventFactory
  private transactionManager: TransactionManager<CanonicalEntity>
  private logger: Logger

  constructor({ accessControl, changelog, index, state, schemaRegistry, meta = {}, schema = [], data = [], logger }: StorageConfig = {}) {
    this.isInitializing = true

    this.logger = logger || defaultLogger

    this.observers = []
    this.ddl = new CoreDdl({ schema, registry: schemaRegistry })
    this.metaDdl = new CoreDdl({
      schema: [{
        type: 'metadata',
        description: 'metadata',
        fields: <Map<SchemaField>>meta
      }]
    })

    this.changeEventFactory = new ChangeEventFactory({
      generator: () => uuidv4(),
      ddl: this.ddl,
      metaDdl: this.metaDdl,
      metaType: 'metadata'
    })

    // Static data is used primarily for automated tests
    const staticChangelog = []
    for (const document of data) {
      staticChangelog.push(this.changeEventFactory.create(none, document))
    }

    this.transactionManager = new TransactionManager()
    this.accessControl = accessControl || new DefaultAccessControl
    this.changelog = changelog || new DefaultChangelog(staticChangelog)
    this.searchIndex = index || new NeDbSearchIndex({ logger: this.logger })
    this.currentState = state || new LocalState({ size: 50000, searchIndex: this.searchIndex })

    this.changelog.observe(x => this.onChange(x))
  }

  private async onChange(event: ChangeEvent) {
    if (event.action === 'delete') {
      await this.currentState.delete(event.entity.id)
      await this.searchIndex.delete(event.entity, event.schema, this.metaDdl.describe('metadata'))
    } else {
      await this.currentState.put(event.entity)
      const entityWithAcl = await this.accessControl.attachTerms(event.entity)

      if (event.action === 'create') {
        await this.searchIndex.index(entityWithAcl, event.schema, this.metaDdl.describe('metadata'))
      } else {
        await this.searchIndex.update(entityWithAcl, event.schema, this.metaDdl.describe('metadata'))
      }
    }

    this.transactionManager.commit(event.entity.version_id, event.entity)

    if (!this.isInitializing) {
      await Promise.all(this.observers.map(f => f(event)))
    }
  }

  async up() {
    await this.searchIndex.up()
    await this.changelog.up()

    if (!(await this.searchIndex.isClean())) {
      await this.changelog.reset()
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

  types() {
    return this.ddl.types()
  }

  describe(type: string) {
    return this.ddl.describe(type)
  }

  define(schema: CanonicalSchema) {
    return this.ddl.define(schema)
  }

  validate(entity: TypedEntity): ValidationResponse {
    return this.ddl.validate(entity.type, entity.body)
  }

  isValid(entity: TypedEntity): boolean {
    return this.ddl.validate(entity.type, entity.body).isValid
  }

  async get(id: UUID, user: UUID = none): Promise<CanonicalEntity> {
    const entity = await this.currentState.get(id)
    const access = await this.accessControl.check(user, 'read', entity);

    if (!access.granted) {
      throw new Error(access.explanation)
    }

    return entity
  }

  async find(query: SearchQuery = {}, options: SearchOptions = {}, user: UUID = none): Promise<Array<CanonicalEntity>> {
    const aclTerms = await this.accessControl.getQuery(user, 'read')
    return await this.searchIndex.find({ ...query, ...aclTerms }, options)
  }

  async count(query: SearchQuery = {}, user: UUID = none): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, 'read')
    return this.searchIndex.count({ ...query, ...aclTerms })
  }

  async create(entity: TypedEntity, user: UUID = none): Promise<CanonicalEntity> {
    const changeEvent = this.changeEventFactory.create(user, entity)

    const transaction = this.transactionManager.start(changeEvent.entity.version_id, 1)
    await this.changelog.write(changeEvent)

    return transaction as Promise<CanonicalEntity>
  }

  async createBulk(collection: Array<TypedEntity>, user: UUID = none): Promise<Array<CanonicalEntity>> {
    return Promise.all(collection.map(entity => this.create(entity, user)))
  }

  async update(entity: IdentifiedEntity, user: UUID = none): Promise<CanonicalEntity> {
    const previous = await this.get(entity.id, user).catch(() => null)
    if (!previous) {
      throw new Error(`[Storage] Entity not found or update not permitted: ${entity.id}`)
    }

    const changeEvent = this.changeEventFactory.createVersion(user, entity, previous)

    const transaction = this.transactionManager.start(changeEvent.entity.version_id, 1)
    await this.changelog.write(changeEvent)

    return transaction as Promise<CanonicalEntity>
  }

  async deleteEntity(id: UUID, user: UUID = none): Promise<CanonicalEntity> {
    const entity = await this.get(id, user)
    if (!entity) {
      throw new Error(`[Storage] Can't delete entity that doesn't exist: ${id}`)
    }

    const changeEvent = this.changeEventFactory.delete(entity)

    const transaction = this.transactionManager.start(entity.version_id, 1)
    await this.changelog.write(changeEvent)

    return transaction as Promise<CanonicalEntity>
  }

  observe(handler: Observer) {
    this.observers.push(handler)
  }
}
