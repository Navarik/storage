//@flow
import uuidv4 from 'uuid/v4'
import map from 'poly-map'
import curry from 'curry'
import flatten from 'array-flatten'
import ChangeLog from '../ports/change-log'
import SearchIndex from '../ports/search-index'
import schemaRegistry from './schema-registry'

import type { Entity, Identifier, ChangelogInterface, ChangeRecord, ChangelogAdapterInterface, SearchIndexInterface, Collection } from '../flowtypes'

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

  constructor(config: Object) {
    this.searchIndex = new SearchIndex(config.searchIndex)
    this.changelogAdapter = config.changeLog
    this.changelogs = {}
  }

  getChangelog(type: string) {
    if (!this.changelogs[type]) {
      this.changelogs[type] = new ChangeLog(type, this.changelogAdapter, generateId)
    }

    return this.changelogs[type]
  }

  async init() {
    const types = schemaRegistry.listUserTypes()
    const logs = await Promise.all(types.map(type =>
      this.getChangelog(type)
        .reconstruct()
        .then(map(data => ({ ...data, type })))
    ))

    await this.searchIndex.init(flatten(logs))
  }

  // Queries
  async find(params: Object) {
    const found = await this.searchIndex.findLatest(params)

    const entities = found.map(x =>
      wrapEntity(x.type, this.getChangelog(x.type).getLatestVersion(x.id))
    )

    return entities
  }

  async findData(params: Object) {
    const found = await this.searchIndex.findLatest(params)

    const entities = found.map(x => ({
      ...this.getChangelog(x.type).getLatestVersion(x.id),
      id: x.id
    }))

    return entities
  }

  async get(id: Identifier, version: ?string): Promise<?Entity> {
    const found = version
      ? await this.searchIndex.findVersions({ id, version })
      : await this.searchIndex.findLatest({ id })

    if (found.length === 0) {
      return undefined
    }

    const type = found[0].type
    const log = this.getChangelog(type)
    const data = log.getVersion(found[0].version_id)
    const entity = wrapEntity(type, data)

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

    const log = this.getChangelog(type)
    const format = schemaRegistry.format(type)

    const record = await log.logNew(format(body))
    const entity = wrapEntity(type, record)

    await this.searchIndex.add(entity)

    return entity
  }

  async createCollection(type: string, bodies: Array<Object>) {
    const validationErrors = schemaRegistry.validate(type, bodies)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const log = this.getChangelog(type)
    const format = schemaRegistry.format(type)

    const records = await Promise.all(bodies.map(x => log.logNew(format(x))))
    const entities = records.map(wrapEntity(type))

    await this.searchIndex.addCollection(entities)

    return entities
  }

  async update(id: Identifier, body: Object) {
    const current = await this.get(id)

    if (!current) {
      throw new Error(`[Entity] Entity doesn's exist for ID: ${id}`)
    }

    const validationErrors = schemaRegistry.validate(current.type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const formatted = schemaRegistry.format(current.type, body)

    const entityRecord = await this.getChangelog(current.type).logChange(id, formatted)
    const entity = wrapEntity(current.type, entityRecord)
    await this.searchIndex.add(entity)

    return entity
  }
}

export default EntityModel
