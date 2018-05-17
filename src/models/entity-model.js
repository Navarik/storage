//@flow
import uuidv4 from 'uuid/v4'
import { map, liftToArray, head, maybe } from '../utils'
import schemaRegistry from './schema-registry'

import type { ModelInterface, Identifier, ChangelogInterface, SearchIndexInterface, Collection } from '../flowtypes'

const generateId = body => uuidv4()
const stringifyProperties = map(x => String(x))

const searchableFormat = liftToArray(data => ({
  id: data.id,
  version: String(data.version),
  version_id: data.version_id,
  type: data.type,
  ...stringifyProperties(data.payload)
}))

class EntityModel implements ModelInterface {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
  }

  async init(source: ?Collection) {
    const log = await (source
      ? Promise.all(source.map(entity =>
        this.changeLog.logNew(entity.type, generateId(), entity.payload)
      ))
      : this.changeLog.reconstruct()
    )

    await this.searchIndex.init(log.map(searchableFormat))
  }

  // Queries
  async find(params: Object) {
    const found = await this.searchIndex.findLatest(stringifyProperties(params))
    const entities = found.map(x => this.changeLog.getLatestVersion(x.id))

    return entities
  }

  async get(id: Identifier, version: ?string) {
    if (!version) {
      return this.changeLog.getLatestVersion(id)
    }

    const searchQuery = stringifyProperties({ id, version })
    const versions = await this.searchIndex.findVersions(searchQuery)
    if (versions.length === 0) {
      return undefined
    }

    return this.changeLog.getVersion(versions[0].version_id)
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

    const entityRecord = await this.changeLog.logNew(type, id, entity)
    await this.searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
  }

  async update(id: Identifier, body: Object) {
    const { type } = this.changeLog.getLatestVersion(id)

    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const entity = schemaRegistry.format(type, body)

    const entityRecord = await this.changeLog.logChange(id, entity)
    await this.searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
  }
}

export default EntityModel
