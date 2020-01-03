import { StringMap } from '@navarik/types'
import { CoreDdl } from '@navarik/core-ddl'
import * as uuidv5 from 'uuid/v5'
import { ChangelogAdapter, UUID, Entity, EntityBody, EntityType, CanonicalEntity, PubSub, ValidationResponse, Observer, SchemaRegistryAdapter, CanonicalSchema } from './types'
import { random } from './id-generator'
import { LocalTransactionManager } from './transaction'
import { LocalState } from './local-state'
import { ChangeLog, DefaultChangelogAdapter, UuidSignatureProvider } from './changelog'
import { EventFanout } from './event-fan-out'
import { whenMatches } from './utils'

const SCHEMA_ID_NAMESPACE = '00000000-0000-0000-0000-000000000000'

type StorageConfig = {
  changelog?: ChangelogAdapter<Entity>
  index?: object
  schema: SchemaRegistryAdapter|Array<CanonicalSchema>
  data?: any
}

export class Storage {
  private ddl: CoreDdl
  private state: LocalState
  private changelog: ChangeLog
  private pubsub: PubSub<Entity>

  constructor(config: StorageConfig) {
    this.ddl = new CoreDdl({ schema: config.schema })

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
    this.pubsub = new EventFanout<Entity>()
  }

  async init() {
    await this.state.reset()

    this.changelog.onChange(async (entity) => {
      await this.state.set(entity)
      await this.pubsub.publish(entity)
    })

    const types = this.ddl.types()
    await this.changelog.reconstruct(types)
  }

  isConnected() {
    return this.changelog.isConnected() && this.state.isConnected()
  }

  types() {
    return this.ddl.types()
  }

  getSchema(type: EntityType) {
    return this.ddl.getSchema(type)
  }

  async get(id: UUID): Promise<CanonicalEntity> {
    return await this.state.get(id)
  }

  async find(query: StringMap = {}, { limit, offset, sort } = { limit: null, offset: 0, sort: null }) {
    return await this.state.find(query, { limit, offset, sort })
  }

  async count(query: StringMap = {}): Promise<number> {
    return this.state.count(query)
  }

  validate(type: EntityType, body: EntityBody): ValidationResponse {
    return this.ddl.validate(type, body)
  }

  isValid(type: EntityType, body: EntityBody): boolean {
    return this.ddl.validate(type, body).isValid
  }

  async create(type: EntityType, body: EntityBody = {}): Promise<CanonicalEntity|Array<CanonicalEntity>> {
    if (body instanceof Array) {
      return Promise.all(body.map(x => this.create(type, x))) as Promise<Array<CanonicalEntity>>
    }

    const content = await this.ddl.format(type, body)
    const entity = await this.changelog.registerNew({
      type,
      body: content.body,
      schema: uuidv5(JSON.stringify(content.schema), uuidv5(type, SCHEMA_ID_NAMESPACE))
    })

    return entity
  }

  async update(id: UUID, body: EntityBody) {
    const previous = await this.state.get(id)

    if (!previous) {
      throw new Error(`[Storage] Can't update ${id}: it doesn't exist.`)
    }

    // Note: every time you update the entity it will update its schema as well
    const content = await this.ddl.format(previous.type, { ...previous.body, ...body })
    const entity = await this.changelog.registerUpdate({
      ...previous,
      body: content.body,
      schema: uuidv5(JSON.stringify(content.schema), uuidv5(previous.type, SCHEMA_ID_NAMESPACE))
    })

    return entity
  }

  observe(handler: Observer<CanonicalEntity>, filter: StringMap = {}) {
    this.pubsub.subscribe(whenMatches(filter, handler))
  }
}
