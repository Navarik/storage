//@flow
import uuidv5 from 'uuid/v5'
import { head, liftToArray, map, get, unique } from '../utils'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

import type { Collection, Identifier, AvroSchema, SchemaRecord, ChangelogInterface, SearchIndexInterface, DataSourceInterface } from '../flowtypes'

// Ischema ID's: Generate same ID for the same schema names
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = body => uuidv5(schemaRegistry.typeName(body), UUID_ROOT)

const presentationFormat = liftToArray(schema =>
  schemaRegistry.get(schemaRegistry.typeName(schema))
)

const searchableFormat = liftToArray((schema: SchemaRecord) => ({
    id: schema.id,
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
    searchIndex.findLatest({}).then(map(get('namespace'))).then(unique)

  const findLatest: SearchQuery = (params) =>
    searchIndex.findLatest(params)
      .then(map(({ id }) => changeLog.getLatestVersion(id)))

  const findVersions: SearchQuery = (params) => searchIndex.findVersions(params)

  const getLatest: IdLookup = (id) => Promise.resolve(changeLog.getLatestVersion(id))

  // Commands
  const create = liftToArray(async (body: AvroSchema): Promise<SchemaRecord> => {
    if (!body.name || !body.namespace) {
      throw new Error('[Schema] Schema namespace and name must be provided')
    }

    const schema = schemaRegistry.add(body)
    const id = generateId(body)
    const schemaRecord = await changeLog.logNew('schema', id, schema)
    await searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  })

  const update = async (id, body) => {
    await schemaRegistry.update(body)

    const schema = await changeLog.logChange(id, body)
    await searchIndex.add(schema)

    return schema
  }

// API
  return {
    getNamespaces,
    getLatest,
    findLatest,
    findVersions,
    create,
    update,
    init
  }
}

export default schemaModel