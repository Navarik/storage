//@flow
import uuidv4 from 'uuid/v4'
import map from 'poly-map'
import curry from 'curry'
import pipe from 'function-pipe'
import filter from 'poly-filter'
import flatten from 'array-flatten'
import { liftToArray, head, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Entity, Identifier, ChangelogInterface, ChangeRecord, ChangelogAdapterInterface, SearchIndexInterface, Collection } from '../flowtypes'

const generateId = body => uuidv4()
const isDefined = x => x !== undefined
const stringifyProperties = pipe(filter(isDefined), map(String))

const wrapEntity = curry((type: string, document: ChangeRecord<Object>): Entity => ({
  ...document,
  type,
  schema: schemaRegistry.get(type).schema()
}))

const searchableFormat = liftToArray(entity => ({
  id: entity.id,
  version: String(entity.version),
  version_id: entity.version_id,
  type: entity.type,
  ...stringifyProperties(entity.body)
}))

class EntityModel {
  searchIndex: SearchIndexInterface
  changelogAdapter: ChangelogAdapterInterface
  changelogs: { [string]: ChangelogInterface }

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
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
        .then(searchableFormat)
    ))

    await this.searchIndex.init(flatten(logs))
  }

  // Queries
  async find(params: Object) {
    const found = await this.searchIndex.findLatest(stringifyProperties(params))

    const entities = found.map(x =>
      wrapEntity(x.type, this.getChangelog(x.type).getLatestVersion(x.id))
    )

    return entities
  }

  async get(id: Identifier, version: ?string): Promise<?Entity> {
    const query = stringifyProperties({ id, version })

    let found
    if (version) {
      found = await this.searchIndex.findVersions(query)
    } else {
      found = await this.searchIndex.findLatest(query)
    }

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
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  async create(type: string, body: Object|Array<Object>) {
    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const log = this.getChangelog(type)
    const format = schemaRegistry.format(type)

    const record = await (body instanceof Array
      ? Promise.all(body.map(x => log.logNew(format(x))))
      : log.logNew(format(body))
    )

    const entity = (record instanceof Array
      ? record.map(wrapEntity(type))
      : wrapEntity(type, record)
    )

    await this.searchIndex.add(searchableFormat(entity))

    return entity
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
    await this.searchIndex.add(searchableFormat(entity))

    return entity
  }
}

export default EntityModel
