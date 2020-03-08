import { CoreDdl, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse } from '@navarik/core-ddl'
import { Changelog, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, TransactionManager, TypedEntity, IdentifiedEntity } from './types'
import uuidv4 from 'uuid/v4'
import { LocalTransactionManager } from './transaction'
import { NeDbSearchIndex } from './adapters/ne-db-search-index'
import { DefaultChangelog } from './adapters/default-changelog'
import { EntityFactory } from './entity-factory'
import { ChangeEventFactory } from './change-event-factory'

export * from './types'

type StorageConfig = {
  changelog?: Changelog
  index?: SearchIndex<CanonicalEntity>
  schemaRegistry?: SchemaRegistryAdapter
  transactionManager?: TransactionManager
  schema?: Array<CanonicalSchema>
  data?: Array<TypedEntity>
}

export class Storage {
  private isInitializing: boolean
  private ddl: CoreDdl
  private searchIndex: SearchIndex<CanonicalEntity>
  private changelog: Changelog
  private observers: Array<Observer>
  private entityFactory: EntityFactory
  private changeEventFactory: ChangeEventFactory
  private transactionManager: TransactionManager

  constructor({ changelog, index, schemaRegistry, transactionManager, schema = [], data = [] }: StorageConfig = {}) {
    this.isInitializing = true

    this.observers = []
    this.ddl = new CoreDdl({ schema, registry: schemaRegistry })
    this.entityFactory = new EntityFactory(() => uuidv4())
    this.changeEventFactory = new ChangeEventFactory()

    // Static data is used primarily for automated tests
    const staticChangelog = []
    for (const document of data) {
      const formatted = this.ddl.format(document.type, document.body)
      const canonical = this.entityFactory.create(formatted)
      const changeEvent = this.changeEventFactory.createEvent('create', canonical, formatted.schema)
      staticChangelog.push(changeEvent)
    }

    this.changelog = changelog || new DefaultChangelog(staticChangelog)
    this.searchIndex = index || new NeDbSearchIndex()
    this.transactionManager = transactionManager || new LocalTransactionManager()

    this.changelog.observe(x => this.onChange(x))
  }

  private async onChange(event: ChangeEvent) {
    if (event.action === 'create') {
      await this.searchIndex.index(event.entity, event.schema)
    } else if (event.action === 'delete') {
      await this.searchIndex.delete(event.entity, event.schema)
    } else {
      await this.searchIndex.update(event.entity, event.schema)
    }

    this.transactionManager.commit(event.entity.version_id)

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
    const [changelogHealth, indexHealth] = await Promise.all([
      this.changelog.isHealthy(),
      this.searchIndex.isHealthy()
    ])

    return changelogHealth && indexHealth
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

  async get(id: UUID): Promise<CanonicalEntity> {
    const [entity] = await this.searchIndex.find({ id }, {})

    return entity
  }

  async find(query: SearchQuery = {}, options: SearchOptions = {}): Promise<Array<CanonicalEntity>> {
    return await this.searchIndex.find(query, options)
  }

  async count(query: SearchQuery = {}): Promise<number> {
    return this.searchIndex.count(query)
  }

  validate(entity: TypedEntity): ValidationResponse {
    return this.ddl.validate(entity.type, entity.body)
  }

  isValid(entity: TypedEntity): boolean {
    return this.ddl.validate(entity.type, entity.body).isValid
  }

  async create(entity: TypedEntity): Promise<CanonicalEntity> {
    const formatted = await this.ddl.format(entity.type, entity.body)

    const canonical = this.entityFactory.create(formatted)

    const transaction = this.transactionManager.start(canonical.version_id, canonical)
    const changeEvent = this.changeEventFactory.createEvent('create', canonical, formatted.schema)
    await this.changelog.write(changeEvent)

    return transaction
  }

  async createBulk(collection: Array<TypedEntity>): Promise<Array<CanonicalEntity>> {
    return Promise.all(collection.map(entity => this.create(entity)))
  }

  async update(entity: IdentifiedEntity): Promise<CanonicalEntity> {
    const previous = await this.get(entity.id)
    if (!previous) {
      throw new Error(`[Storage] Can't update entity that doesn't exist: ${entity.id}`)
    }

    const type = entity.type || previous.type
    const formatted = await this.ddl.format(type, { ...previous.body, ...entity.body })

    const canonical = this.entityFactory.createVersion(formatted, previous)

    const transaction = this.transactionManager.start(canonical.version_id, canonical)
    const changeEvent = this.changeEventFactory.createEvent('update', canonical, formatted.schema, previous)
    await this.changelog.write(changeEvent)

    return transaction
  }

  async delete(id: UUID): Promise<CanonicalEntity> {
    const entity = await this.get(id)
    if (!entity) {
      throw new Error(`[Storage] Can't delete entity that doesn't exist: ${id}`)
    }

    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = this.changeEventFactory.createEvent('delete', entity)
    await this.changelog.write(changeEvent)

    return transaction
  }

  observe(handler: Observer) {
    this.observers.push(handler)
  }
}
