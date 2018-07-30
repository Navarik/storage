//@flow
import uuidv4 from 'uuid/v4'
import map from 'poly-map'
import curry from 'curry'
import flatten from 'array-flatten'
import { InMemoryStateAdapter } from './adapters/local-state'
import ChangeLog from './ports/change-log'
import SearchIndex from './ports/search-index'
import schemaRegistry from './ports/schema-registry'
import SignatureProvider from './ports/signature-provider'
import { start, commit } from './transaction'

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

  constructor(config: Object) {
    this.searchIndex = new SearchIndex('entity', config.searchIndex)
    this.changelogAdapter = config.changeLog
    this.signature = new SignatureProvider(generateId)
    this.changelogs = {}
    this.state = new InMemoryStateAdapter()
  }

  getChangelog(type: string) {
    if (!this.changelogs[type]) {
      this.changelogs[type] = new ChangeLog(type, this.changelogAdapter, generateId)
      this.changelogs[type].onChange(async (record) => {
        const entity = { ...record, type }
        this.state.set(record.id, entity)
        await this.searchIndex.add(entity)
        commit(record.version_id, wrapEntity(type, record))
      })
    }

    return this.changelogs[type]
  }

  async init() {
    this.state.reset()

    const types = schemaRegistry.listUserTypes()
    await Promise.all(types.map(type =>
      this.getChangelog(type)
        .reconstruct()
        .then(map((record) => {
          const entity = record.id ? record : this.signature.signNew(record)
          this.state.set(entity.id, { ...entity, type })
        }))
    ))

    await this.searchIndex.init(this.state.getAll())
  }

  // Queries
  async find(params: Object) {
    const found = await this.searchIndex.find(params)
    if (!found) {
      return []
    }

    const entities = found.map(x =>
      wrapEntity(x.type, this.state.get(x.id))
    )

    return entities
  }

  async findData(params: Object) {
    const found = await this.searchIndex.find(params)
    const entities = found.map(x => ({
      ...this.state.get(x.id),
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
    const transaction = start(record.version_id)
    this.getChangelog(type).register(record)

    return transaction.promise
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

    const transaction = start(next.version_id)
    this.getChangelog(type).register(next)

    return transaction.promise
  }
}

export default EntityModel
