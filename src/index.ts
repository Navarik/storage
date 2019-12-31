import { StringMap } from '@navarik/types'
import { ChangelogAdapter, EntityId, EntityBody, EntityType, CanonicalSchema, CanonicalEntity, SchemaRegistryAdapter, PubSub, SchemaEngine, ValidationResponse, Observer } from './types'
import { random } from './id-generator'
import { LocalTransactionManager } from './transaction'
import { StaticSchemaRegistry, AvroSchemaEngine } from './schema'
import { LocalState } from './local-state'
import { ChangeLog, DefaultChangelogAdapter, UuidSignatureProvider } from './changelog'
import { EventFanout } from './event-fan-out'
import { whenMatches } from './utils'

type StorageConfig = {
  schemaRegistry?: SchemaRegistryAdapter
  changelog?: ChangelogAdapter
  index?: object
  schema?: Array<CanonicalSchema>
  data?: any
}

export class Storage {
  private schemaRegistry: SchemaRegistryAdapter
  private state: LocalState
  private changelog: ChangeLog
  private pubsub: PubSub<CanonicalEntity>
  private schemaEngine: SchemaEngine

  constructor(config: StorageConfig = {}) {
    this.schemaRegistry = config.schemaRegistry
      || new StaticSchemaRegistry({ schemas: config.schema || [] })

    const transactionManager = new LocalTransactionManager()
    const signatureProvider = new UuidSignatureProvider(random())
    const changelogAdapter = config.changelog
      || new DefaultChangelogAdapter({ content: config.data || [], signatureProvider })

      this.changelog = new ChangeLog({
        adapter: changelogAdapter,
        signatureProvider,
        transactionManager
      })

    this.state = new LocalState(config.index || 'default', 'id')
    this.pubsub = new EventFanout<CanonicalEntity>()

    this.schemaEngine = new AvroSchemaEngine({ registry: this.schemaRegistry })
  }

  async init() {
    await this.state.reset()

    this.changelog.onChange(async (entity) => {
      await this.state.set(entity)
      await this.pubsub.publish(entity)
    })

    const types = this.schemaRegistry.list()
    await this.changelog.reconstruct(types)
  }

  isConnected() {
    return this.changelog.isConnected() && this.state.isConnected()
  }

  types() {
    return this.schemaRegistry.list()
  }

  getSchema(type: EntityType) {
    return this.schemaRegistry.get(type)
  }

  private addSchema(entity: CanonicalEntity|Array<CanonicalEntity>): CanonicalEntity|Array<CanonicalEntity>|undefined {
    if (entity === undefined) {
      return undefined
    }

    return entity instanceof Array
      ? entity.map(x => this.addSchema(x)) as Array<CanonicalEntity>
      : { ...entity, schema: this.schemaRegistry.get(entity.type) } as CanonicalEntity
  }

  async get(id: EntityId, version: number): Promise<CanonicalEntity> {
    return this.addSchema(await this.state.get(id, version)) as CanonicalEntity
  }

  async find(query: StringMap = {}, { limit, offset, sort } = { limit: null, offset: 0, sort: null }) {
    return this.addSchema(await this.state.find(query, { limit, offset, sort }))
  }

  async count(query: StringMap = {}): Promise<number> {
    return this.state.count(query)
  }

  validate(type: EntityType, body: EntityBody): ValidationResponse {
    return this.schemaEngine.validate(type, body)
  }

  isValid(type: EntityType, body: EntityBody): boolean {
    return this.schemaEngine.validate(type, body).isValid
  }

  async create(type: EntityType, body: EntityBody = {}): Promise<CanonicalEntity|Array<CanonicalEntity>> {
    if (body instanceof Array) {
      return Promise.all(body.map(x => this.create(type, x))) as Promise<Array<CanonicalEntity>>
    }

    const content = await this.schemaEngine.format(type, body)
    const entity = await this.changelog.registerNew(type, content)

    return this.addSchema(entity) as CanonicalEntity
  }

  async update(id: EntityId, body: EntityBody, type: EntityType = '') {
    const previous = await this.state.get(id)

    if (!previous) {
      throw new Error(`[Storage] Can't update ${id}: it doesn't exist.`)
    }

    const newType = type || previous.type
    const newContent = await this.schemaEngine.format(newType, body)
    const entity = await this.changelog.registerUpdate(newType, previous, newContent)

    return this.addSchema(entity)
  }

  observe(handler: Observer<CanonicalEntity>, filter: StringMap = {}) {
    this.pubsub.subscribe(whenMatches(filter, handler))
  }
}
