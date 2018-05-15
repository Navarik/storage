//@flow
import uuidv5 from 'uuid/v5'
import { head, liftToArray, map, get, unique, maybe } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Identifier, AvroSchema, SchemaRecord, ChangelogInterface, SearchIndexInterface, DataSourceInterface } from '../flowtypes'

// Generate same IDs for the each name + namespace combination
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = body => uuidv5(schemaRegistry.typeName(body), UUID_ROOT)

const searchableFormat = liftToArray((schema: SchemaRecord) => ({
    id: schema.id,
    version: schema.version,
    version_id: schema.version_id,
    name: schema.payload.name,
    namespace: schema.payload.namespace,
    description: schema.payload.description,
    fields: schema.payload.fields.map(get('name'))
  })
)

type SchemaConfiguration = {
  searchIndex: SearchIndexInterface,
  changeLog: ChangelogInterface,
  dataSource: DataSourceInterface
}

type SearchQuery = (params: Object) => Promise<Array<SchemaRecord>>
type IdLookup = (id: Identifier) => Promise<?SchemaRecord>

const schemaModel = (config: SchemaConfiguration) => {
  const searchIndex = config.searchIndex
  const changeLog = config.changeLog

  const init = async () => {
    const log = await changeLog.reconstruct()
    await searchIndex.init(log)
  }

  // Queries
  const getNamespaces = () =>
    searchIndex
      .findLatest({})
      .then(map(get('namespace')))
      .then(unique)

  const getLatest: IdLookup = (id) => Promise.resolve(changeLog.getLatestVersion(id))

  const getVersion = (id: Identifier, version: number) =>
    searchIndex
      .findVersions({ id, version })
      .then(head)
      .then(maybe(x => changeLog.getVersion(x.version_id)))

  const findLatest: SearchQuery = (params) =>
    searchIndex
      .findLatest(params)
      .then(map(({ id }) => changeLog.getLatestVersion(id)))

  const findVersions: SearchQuery = (params) => searchIndex.findVersions(params)

  // Commands
  const create = liftToArray(async (body: AvroSchema): Promise<SchemaRecord> => {
    const schema = schemaRegistry.add(body)

    const id = generateId(schema)
    const schemaRecord = await changeLog.logNew('schema', id, schema)
    await searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  })

  const update = async (id: Identifier, body: AvroSchema) => {
    const schema = schemaRegistry.update(body)

    const schemaRecord = await changeLog.logChange(id, schema)
    await searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  }

// API
  return {
    getNamespaces,
    getLatest,
    getVersion,
    findLatest,
    findVersions,
    create,
    update,
    init
  }
}

export default schemaModel