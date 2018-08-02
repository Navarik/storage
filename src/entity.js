//@flow
import uuidv4 from 'uuid/v4'
import map from 'poly-map'
import curry from 'curry'
import schemaRegistry from './ports/schema-registry'
import SignatureProvider from './ports/signature-provider'

import type { SignatureProviderInterface, Entity, Identifier, ChangelogInterface, ChangeRecord, ChangelogAdapterInterface, SearchIndexInterface, Collection } from '../flowtypes'

const generateId = body => uuidv4()
const isDefined = x => x !== undefined

const wrapEntity = curry((type: string, document: ChangeRecord<Object>): Entity => ({
  ...document,
  type,
  schema: schemaRegistry.get(type).schema()
}))

class EntityModel {
  searchIndex: SearchIndexInterface
  changelogAdapter: ChangelogAdapterInterface
  changelogs: { [string]: ChangelogInterface }
  signature: SignatureProviderInterface
  state: InMemoryStateAdapter

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
    this.state = config.state
    this.signature = new SignatureProvider(generateId)

    this.changeLog.onChange(async (entity) => {
      this.state.set(entity.id, entity)
      await this.searchIndex.add(entity)
      return wrapEntity(entity.type, entity)
    })
  }

  async init() {
    this.state.reset()

    const types = schemaRegistry.listUserTypes()
    await Promise.all(types.map(type =>
      this.changeLog
        .reconstruct(type)
        .then(map((record) => {
          const entity = record.id ? record : this.signature.signNew(record)
          this.state.set(entity.id, { ...entity, type })
        }))
    ))

    await this.searchIndex.init(this.state.getAll())
  }

  // Queries
  async find(params: Object, limit: ?number, skip: ?number) {
    const found = await this.searchIndex.find(params, limit, skip)
    if (!found) {
      return []
    }

    const entities = found.map(x => wrapEntity(x.type, this.state.get(x.id)))

    return entities
  }

  async findData(params: Object, limit: ?number, skip: ?number) {
    const found = await this.searchIndex.find(params, limit, skip)
    const entities = found.map(x => ({
      ...this.state.get(x.id).body,
      id: x.id
    }))

    return entities
  }

  async get(id: Identifier, version: ?string): Promise<?Entity> {
    const found = version
      ? this.state.getVersion(id, version)
      : this.state.get(id)

    if (!found) {
      return undefined
    }

    const entity = wrapEntity(found.type, found)

    return entity
  }

  // Commands
  validate(type: string, body: Object) {
    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      return `[Entity] Invalid value provided for: ${validationErrors.join(', ')}`
    }

    return ''
  }

  isValid(type: string, body: Object) {
    const validationErrors = schemaRegistry.validate(type, body)
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  async create(type: string, body: Object) {
    const validationError = this.validate(type, body)
    if (validationError) {
      throw new Error(validationError)
    }

    const entity = schemaRegistry.formatData(type, body)
    const record = this.signature.signNew(entity)

    return this.changeLog.register(type, record)
  }

  async update(id: Identifier, body: Object) {
    if (!this.state.exists(id)) {
      throw new Error(`[Storage] Attempting to update entity that doesn't exist: ${id}.`)
    }

    const previous = this.state.get(id)
    const type = previous.type
    const validationError = this.validate(type, body)
    if (validationError) {
      throw new Error(validationError)
    }

    const entity = schemaRegistry.formatData(type, body)
    const next = this.signature.signVersion(entity, previous)

    return this.changeLog.register(type, next)
  }
}

export default EntityModel
