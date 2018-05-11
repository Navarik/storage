//@flow
import uuidv5 from 'uuid/v5'
import { head, liftToArray, map, get, unique } from '../utils'
import SearchIndex from '../ports/search-index'
import ChangeLog from '../ports/change-log'
import DataSource from '../ports/data-source'
import schemaRegistry from './schema-registry'

import type { Collection, Identifier, AvroSchema, SchemaRecord, QueueAdapterInterface, SearchIndexAdapterInterface, DataSourceAdapterInterface } from '../flowtypes'

// Ischema ID's: Generate same ID for the same schema names
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const idGenerator = body => uuidv5(schemaRegistry.typeName(body), UUID_ROOT)

const presentationFormat = liftToArray(schema =>
  schemaRegistry.get(schemaRegistry.typeName(schema))
)

const searchableFormat = liftToArray((schema: SchemaRecord) => {
  const result = {
    id: schema.id,
    name: schema.payload.name,
    namespace: schema.payload.namespace,
  }

  for (let field of schema.payload.fields) {
    result[field.name] = String(field.type)
  }

  return result
})

type SchemaConfiguration = {
  searchIndex: SearchIndexAdapterInterface,
  queue: QueueAdapterInterface,
  dataSources: DataSourceAdapterInterface
}

type SearchQuery = (params: Object) => Promise<Array<SchemaRecord>>
type IdLookup = (id: Identifier) => Promise<?SchemaRecord>

const schemaModel = (config: SchemaConfiguration) => {
  const searchIndex = new SearchIndex({
    bucket: 'schema',
    adapter: config.searchIndex
  })

  const changeLog = new ChangeLog({
    idGenerator,
    topic: 'schema',
    queue: config.queue
  })

  const dataSource = new DataSource({
    adapters: config.dataSources
  })

  const restoreState = async (path) => {
    if (path) {
      const data = await dataSource.read(path)
      await create(data)
    } else {
      const { log, latest } = await changeLog.reconstruct()
      await schemaRegistry.add(latest)
      await searchIndex.init(latest, log)
    }
  }

  // Queries
  const getNamespaces = () =>
    searchIndex.findLatest({}).then(map(get('namespace'))).then(unique)

  const findLatest: SearchQuery = (params) =>searchIndex.findLatest(params)

  const findVersions: SearchQuery = (params) => searchIndex.findVersions(params)

  const getLatest: IdLookup = (id) => Promise.resolve(changeLog.getLatestVersion(id))

  // Commands
  const create = liftToArray(async (body: AvroSchema): Promise<SchemaRecord> => {
    if (!body.name || !body.namespace) {
      throw new Error('[Schema] Schema namespace and name must be provided')
    }

    const schema = schemaRegistry.add(body)
    const schemaRecord = await changeLog.logNew('schema', schema)
    await searchIndex.add(searchableFormat(schemaRecord))

    return schemaRecord
  })

  const update = async (id, body) => {
    await schemaRegistry.update(body)

    const schema = await changeLog.logChange({ ...body, id })
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
    restoreState
  }
}

export default schemaModel