import { Document, Dictionary } from '@navarik/types'
import { CoreDdl, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse } from '@navarik/core-ddl'
import { Changelog, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, TransactionManager } from './types'
import uuidv4 from 'uuid/v4'
import { LocalTransactionManager } from './transaction'
import { NeDbSearchIndex } from './adapters/ne-db-search-index'
import { DefaultChangelog } from './adapters/default-changelog'
import { EntityFactory } from './entity-factory'
import { ChangeEventFactory } from './change-event-factory'

export * from './types'

type StorageConfig = {
  changelog?: Changelog
  index?: SearchIndex
  schemaRegistry?: SchemaRegistryAdapter
  transactionManager?: TransactionManager
  schema?: Array<CanonicalSchema>
  data?: Dictionary<Array<Document>>
}

export class Storage {
  private ddl: CoreDdl
  private searchIndex: SearchIndex
  private changelog: Changelog
  private observers: Array<Observer>
  private entityFactory: EntityFactory
  private changeEventFactory: ChangeEventFactory
  private transactionManager: TransactionManager

  constructor({ changelog, index, schemaRegistry, transactionManager, schema = [], data = {} }: StorageConfig = {}) {
    this.observers = []
    this.ddl = new CoreDdl({ schema, registry: schemaRegistry })
    this.entityFactory = new EntityFactory(() => uuidv4())
    this.changeEventFactory = new ChangeEventFactory()

    // Static data is used primarily for automated tests
    const staticChangelog = []
    for (const type in data) {
      const collection = data[type] || []
      for (const document of collection) {
        const entity = this.entityFactory.create(this.ddl.format(type, document))
        const changeEvent = this.changeEventFactory.createEvent('create', entity)
        staticChangelog.push(changeEvent)
      }
    }

    this.changelog = changelog || new DefaultChangelog(staticChangelog)
    this.searchIndex = index || new NeDbSearchIndex()
    this.transactionManager = transactionManager || new LocalTransactionManager()

    this.changelog.observe(x => this.onChange(x))
  }

  private async onChange(event: ChangeEvent) {
    if (event.action === 'create') {
      await this.searchIndex.index(event.entity)
    } else if (event.action === 'delete') {
      await this.searchIndex.delete(event.entity)
    } else {
      await this.searchIndex.update(event.entity)
    }

    this.transactionManager.commit(event.entity.version_id)
    await Promise.all(this.observers.map(f => f(event)))
  }

  async up() {
    await this.searchIndex.up()
    await this.changelog.init()

    if (!(await this.searchIndex.isClean())) {
      await this.changelog.reset()
    }
  }

  async down() {}

  isHealthy() {
    return this.changelog.isConnected() && this.searchIndex.isHealthy()
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

  validate(type: string, body: Document): ValidationResponse {
    return this.ddl.validate(type, body)
  }

  isValid(type: string, body: Document): boolean {
    return this.ddl.validate(type, body).isValid
  }

  async create(type: string, body: Document): Promise<CanonicalEntity> {
    const content = await this.ddl.format(type, body)
    const entity = this.entityFactory.create(content)
    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = this.changeEventFactory.createEvent('create', entity)
    await this.changelog.write(changeEvent)

    return transaction
  }

  async createBulk(type: string, collection: Array<Document>): Promise<Array<CanonicalEntity>> {
    return Promise.all(collection.map(x => this.create(type, x)))
  }

  async update(id: UUID, body: Document): Promise<CanonicalEntity> {
    const previous = await this.get(id)
    if (!previous) {
      throw new Error(`[Storage] Can't update entity that doesn't exist: ${id}`)
    }

    const content = await this.ddl.format(previous.type, { ...previous.body, ...body })
    const entity = this.entityFactory.createVersion(content, previous)
    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = this.changeEventFactory.createEvent('update', entity)
    await this.changelog.write(changeEvent)

    return transaction
  }

  async cast(id: UUID, type: string): Promise<CanonicalEntity> {
    const previous = await this.get(id)
    if (!previous) {
      throw new Error(`[Storage] Can't cast entity that doesn't exist: ${id}`)
    }

    const content = await this.ddl.format(type, previous.body)
    const entity = this.entityFactory.createVersion(content, previous)
    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = this.changeEventFactory.createEvent('cast', entity)
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
