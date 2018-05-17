//@flow
import uuidv5 from 'uuid/v5'
import unique from 'array-unique'
import { head, liftToArray, map, get, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { ModelInterface, Identifier, AvroSchema, SchemaRecord, ChangelogInterface, SearchIndexInterface, Collection } from '../flowtypes'

// Generate same IDs for the each name + namespace combination
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = name => uuidv5(name, UUID_ROOT)

const searchableFormat = liftToArray((schema: SchemaRecord) => ({
    id: schema.id,
    version: schema.version,
    version_id: schema.version_id,
    name: schema.payload.name,
    namespace: schema.payload.namespace,
    full_name: schemaRegistry.fullName(schema.payload),
    description: schema.payload.description,
    fields: schema.payload.fields.map(get('name'))
  })
)

class SchemaModel implements ModelInterface {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
  }

  async init(source: ?Collection) {
    const log = await (source
      ? Promise.all(source.map(schema =>
        this.changeLog.logNew('schema', generateId(schemaRegistry.fullName(schema)), schema)
      ))
      : this.changeLog.reconstruct()
    )

    await this.searchIndex.init(log.map(searchableFormat))
    schemaRegistry.init(log.map(x => x.payload))
  }

  // Queries
  getNamespaces() {
    return this.searchIndex
      .findLatest({})
      .then(map(get('namespace')))
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

    const id = generateId(schemaRegistry.fullName(body))
    const schemaRecord = await this.changeLog.logNew('schema', id, schema)
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