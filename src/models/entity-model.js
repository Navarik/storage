//@flow
import uuidv4 from 'uuid/v4'
import map from 'poly-map'
import { liftToArray, head, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Identifier, ChangelogInterface, ChangelogAdapterInterface, SearchIndexInterface, Collection } from '../flowtypes'

const generateId = body => uuidv4()
const stringifyProperties = map(x => String(x))

const searchableFormat = liftToArray(entity => ({
  id: entity.id,
  version: String(entity.version),
  version_id: entity.version_id,
  type: entity.type,
  ...stringifyProperties(entity.body)
}))

class EntityModel {
  namespace: string
  searchIndex: SearchIndexInterface
  changelogAdapter: ChangelogAdapterInterface
  changelogs: { [string]: ChangelogInterface }

  constructor(config: Object) {
    this.namespace = config.namespace
    this.searchIndex = config.searchIndex
    this.changelogAdapter = config.changeLog
    this.changelogs = {}
  }

  getChangelog(type: string) {
    if (!this.changelogs[type]) {
      this.changelogs[type] = new ChangeLog(
        `${this.namespace}.${type}`,
        this.changelogAdapter
      )
    }

    return this.changelogs[type]
  }

  async init(source: ?Collection) {
    const log = await (source && source.length
      ? Promise.all(source.map(x =>
        this.getChangelog(x.type).logNew(generateId(), x.body)
      ))
      : []//this.getChangelog(x.type).reconstruct()
    )

    await this.searchIndex.init(log.map(searchableFormat))
  }

  // Queries
  async find(params: Object) {
    const found = await this.searchIndex.findLatest(stringifyProperties(params))
    const entities = found.map(x => this.getChangelog(type).getLatestVersion(x.id))

    return entities
  }

  async get(id: Identifier, version: ?string) {
    if (!version) {
      return this.getChangelog(type).getLatestVersion(id)
    }

    const searchQuery = stringifyProperties({ id, version })
    const versions = await this.searchIndex.findVersions(searchQuery)
    if (versions.length === 0) {
      return undefined
    }

    return this.getChangelog(type).getVersion(versions[0].version_id)
  }

  // Commands
  validate(type: string, body: Object) {
    const validationErrors = schemaRegistry.validate(type, body)
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  async create(type: string, body: Object) {
    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const entity = schemaRegistry.format(type, body)
    const id = generateId()

    const entityRecord = await this.getChangelog(type).logNew(id, entity)
    await this.searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
  }

  async update(id: Identifier, body: Object) {
    const { type } = this.getChangelog(type).getLatestVersion(id)

    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const entity = schemaRegistry.format(type, body)

    const entityRecord = await this.getChangelog(type).logChange(id, entity)
    await this.searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
  }
}

export default EntityModel
