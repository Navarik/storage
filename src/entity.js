//@flow
import map from 'poly-map'
import curry from 'curry'

import type { Entity, Identifier, ChangelogInterface, ChangeRecord, ChangelogAdapterInterface, SearchIndexInterface, Collection } from '../flowtypes'

class EntityModel {
  searchIndex: SearchIndexInterface
  changelogAdapter: ChangelogAdapterInterface
  changelogs: { [string]: ChangelogInterface }
  state: InMemoryStateAdapter

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
    this.state = config.state
    this.schemaRegistry = config.schemaRegistry

    this.changeLog.onChange(async (entity) => {
      this.state.set(entity.id, entity)
      await this.searchIndex.add(entity)
      return this.wrapEntity(entity.type, entity)
    })
  }

  wrapEntity(type: string, document: ChangeRecord<Object>) {
    return {
      ...document,
      type,
      schema: this.schemaRegistry.get(type).schema()
    }
  }

  async init() {
    this.state.reset()

    const types = this.schemaRegistry.listUserTypes()
    await Promise.all(types.map(type =>
      this.changeLog
        .reconstruct(type)
        .then(map((entity) => {
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

    const entities = found.map(x => this.wrapEntity(x.type, this.state.get(x.id)))

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

    const entity = this.wrapEntity(found.type, found)

    return entity
  }

  // Commands
  validate(type: string, body: Object) {
    if (!this.schemaRegistry.exists(type)) {
      return `[Entity] Unknown type: ${type}`
    }

    const validationErrors = this.schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      return `[Entity] Invalid value provided for: ${validationErrors.join(', ')}`
    }

    return ''
  }

  isValid(type: string, body: Object) {
    const validationErrors = this.schemaRegistry.validate(type, body)
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  async create(type: string, body: Object) {
    const validationError = this.validate(type, body)
    if (validationError) {
      throw new Error(validationError)
    }

    const entity = this.schemaRegistry.format(type, body)

    return this.changeLog.registerNew(type, entity)
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

    const next = this.schemaRegistry.format(type, body)

    return this.changeLog.registerUpdate(type, previous, next)
  }
}

export default EntityModel
