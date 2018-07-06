//@flow
import uuidv5 from 'uuid/v5'
import unique from 'array-unique'
import map from 'poly-map'
import { head, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Identifier, Schema, AvroSchema, ChangeRecord, ChangelogInterface, SearchIndexInterface, Collection } from '../flowtypes'

// Generate same IDs for the each name + namespace combination
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = (body: Object) => uuidv5(body.name, UUID_ROOT)

class SchemaModel {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = new ChangeLog('schema', config.changeLog, generateId)
  }

  async init() {
    const log = await this.changeLog.reconstruct()
    await schemaRegistry.init(log.map(x => x.body))
    await this.searchIndex.init(log)
  }

  // Queries
  get(name: string, version: ?string) {
    const schema = schemaRegistry.get(name)
    if (!schema) return Promise.resolve(undefined)

    const id = generateId(schema)

    if (!version) {
      return Promise.resolve(this.changeLog.getLatestVersion(id))
    }

    return this.searchIndex
      .findVersions({ id, version })
      .then(head)
      .then(maybe(x => this.changeLog.getVersion(x.version_id)))
  }

  async find(params: Object) {
    const found = await this.searchIndex.findLatest(params)
    const schemas = found.map(x => this.changeLog.getLatestVersion(x.id))

    return schemas
  }

  // Commands
  async create(type: string, body: AvroSchema) {
    const schema = schemaRegistry.add(body)

    const schemaRecord = await this.changeLog.logNew(schema)
    await this.searchIndex.add(schemaRecord)

    return schemaRecord
  }

  async update(name: string, body: AvroSchema) {
    const schema = schemaRegistry.update(body)

    const id = generateId(body)
    const schemaRecord = await this.changeLog.logChange(id, schema)
    await this.searchIndex.add(schemaRecord)

    return schemaRecord
  }
}

export default SchemaModel