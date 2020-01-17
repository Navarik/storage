import { Document, Dictionary } from '@navarik/types'
import { CoreDdl, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse } from '@navarik/core-ddl'
import { ChangelogAdapter, SearchIndexAdapter, UUID, CanonicalEntity, Observer, SearchOptions, SearchQuery, ChangeEvent, EntityFactory } from './types'
import uuidv4 from 'uuid/v4'
import { LocalTransactionManager } from './transaction'
import { LocalState, NeDbIndexAdapter } from './local-state'
import { ChangeLog, DefaultChangelogAdapter } from './changelog'
import { CanonicalEntityFactory } from './canonical-entity-factory'

export * from './types'

type StorageConfig = {
  changelog?: ChangelogAdapter
  index?: SearchIndexAdapter
  schemaRegistry?: SchemaRegistryAdapter
  schema?: Array<CanonicalSchema>
  data?: Dictionary<Array<Document>>
}

export class Storage {
  private ddl: CoreDdl
  private state: LocalState
  private changelog: ChangeLog
  private observers: Array<Observer>
  private factory: EntityFactory

  constructor({ changelog, index, schemaRegistry, schema = [], data = {} }: StorageConfig = {}) {
    this.observers = []
    this.ddl = new CoreDdl({ schema, registry: schemaRegistry })
    this.factory = new CanonicalEntityFactory(() => uuidv4())

    // Static data is used primarily for automated tests
    const staticChangelog = []
    for (const type in data) {
      const collection = data[type] || []
      for (const document of collection) {
        const entity = this.factory.create(this.ddl.format(type, document))
        staticChangelog.push({
          action: 'create',
          entity,
          parent: null,
          timestamp: entity.created_at
        })
      }
    }

    this.changelog = new ChangeLog({
      adapter: changelog || new DefaultChangelogAdapter(staticChangelog),
      transactionManager: new LocalTransactionManager()
    })

    this.state = new LocalState({
      searchIndex: index || new NeDbIndexAdapter()
    })

    this.changelog.onChange(async (changeEvent) => {
      await this.state.set(changeEvent.entity)
      await this.publishChange(changeEvent)
    })
  }

  private async publishChange(event: ChangeEvent) {
    await Promise.all(this.observers.map(f => f(event)))
  }

  async init() {
    await this.state.init()
    await this.changelog.init()

    if (!(await this.state.isCleant())) {
      await this.changelog.reconstruct()
    }
  }

  isConnected() {
    return this.changelog.isConnected() && this.state.isConnected()
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
    return await this.state.get(id)
  }

  async find(query: SearchQuery = {}, options: SearchOptions = {}) {
    return await this.state.find(query, options)
  }

  async count(query: SearchQuery = {}): Promise<number> {
    return this.state.count(query)
  }

  validate(type: string, body: Document): ValidationResponse {
    return this.ddl.validate(type, body)
  }

  isValid(type: string, body: Document): boolean {
    return this.ddl.validate(type, body).isValid
  }

  async create(type: string, body: Document): Promise<CanonicalEntity> {
    const content = await this.ddl.format(type, body)
    const entity = this.factory.create(content)

    return this.changelog.registerNew(entity)
  }

  async createBulk(type: string, collection: Array<Document>): Promise<Array<CanonicalEntity>> {
    return Promise.all(collection.map(x => this.create(type, x)))
  }

  async update(id: UUID, body: Document) {
    const previous = await this.state.get(id)
    if (!previous) {
      throw new Error(`[Storage] Can't update entity that doesn't exist: ${id}`)
    }

    const content = await this.ddl.format(previous.type, { ...previous.body, ...body })
    const entity = this.factory.createVersion(content, previous)

    return this.changelog.registerUpdate(entity, previous)
  }

  async cast(id: UUID, type: string) {
    const previous = await this.state.get(id)
    if (!previous) {
      throw new Error(`[Storage] Can't cast entity that doesn't exist: ${id}`)
    }

    const content = await this.ddl.format(type, previous.body)
    const entity = this.factory.createVersion(content, previous)

    return this.changelog.registerUpdate(entity, previous)
  }

  observe(handler: Observer) {
    this.observers.push(handler)
  }
}
