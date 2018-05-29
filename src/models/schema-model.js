//@flow
import uuidv5 from 'uuid/v5'
import unique from 'array-unique'
import map from 'poly-map'
import { head, liftToArray, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Identifier, Schema, AvroSchema, ChangeRecord, ChangelogInterface, SearchIndexInterface, Collection } from '../flowtypes'

// Generate same IDs for the each name + namespace combination
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = name => uuidv5(name, UUID_ROOT)

const searchableFormat = liftToArray((schema: ChangeRecord<AvroSchema>) =>
  ({
    id: schema.id,
    version: schema.version,
    version_id: schema.version_id,
    name: schema.body.name,
    namespace: schema.body.namespace,
    full_name: schemaRegistry.fullName(schema.body),
    description: schema.body.description,
    fields: schema.body.fields.map(x => x.name)
  })
)

class SchemaModel {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = new ChangeLog(
      `${config.namespace}.schema`,
      config.changeLog,
      body => generateId(schemaRegistry.fullName(body))
    )
  }

  async init() {
    const log = await this.changeLog.reconstruct()
    await schemaRegistry.init(log.map(x => x.body))
    await this.searchIndex.init(log.map(searchableFormat))
  }

  // Queries
  getNamespaces() {
    return this.searchIndex
      .findLatest({})
      .then(map(x => x.namespace))
      .then(unique)
  }

  get(name: string, version: ?string) {
    const schema = schemaRegistry.get(name)
    if (!schema) return Promise.resolve(undefined)

    // Avro is weird: after adding a new schema to the registry,
    // it removes schema's namespace property and changes its name to 'namespace.name'
    const id = generateId(schema.name)

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
    await this.searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  }

  async update(name: string, body: AvroSchema) {
    const schema = schemaRegistry.update(body)

    const id = generateId(schemaRegistry.fullName(body))
    const schemaRecord = await this.changeLog.logChange(id, schema)
    await this.searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  }
}

export default SchemaModel