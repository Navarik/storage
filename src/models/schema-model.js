import uuidv5 from 'uuid/v5'
import { head, liftToArray, map, get, unique } from '../utils'
import SearchIndex from '../ports/search-index'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

// Ischema ID's: Generate same ID for the same schema names
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const idGenerator = body => uuidv5(schemaRegistry.typeName(body), UUID_ROOT)

const presentationFormat = liftToArray(schema => schemaRegistry.get(schemaRegistry.typeName(schema)))
const searchableFormat = liftToArray(schema => {
  const result = {
    id: schema.id,
    name: schema.name,
    namespace: schema.namespace,
  }

  for (let field of schema.fields) {
    result[field.name] = String(field.type)
  }

  return result
})

const schemaModel = (config) => {
  const searchIndex = new SearchIndex({
    format: presentationFormat
  })

  const changeLog = new ChangeLog({
    idGenerator,
    topic: 'schema',
    queue: config.queue
  })

  const restoreState = async () => {
    const { log, latest } = await changeLog.reconstruct()

    await schemaRegistry.add(latest)
    await searchIndex.init(latest, log)
  }

  // Queries
  const getNamespaces = params =>
    searchIndex.findLatest({}).then(map(get('namespace'))).then(unique)

  const findOneLatest = params => searchIndex.findLatest(params).then(head)

  const findOneVersion = params => searchIndex.findVersions(params).then(head)

  // Commands
  const create = liftToArray(async (body) => {
    await schemaRegistry.add(body)

    const schema = await changeLog.logNew(body)
    await searchIndex.add(searchableFormat(schema))

    return schema
  })

  const update = async (id, body) => {
    await schemaRegistry.update(body)

    const schema = await changeLog.logChange({ ...body, id })
    await searchIndex.add(searchableFormat(schema))

    return schema
  }

// API
  return {
    findLatest: params => searchIndex.findLatest(params),
    findVersions: params => searchIndex.findVersions(params),
    getLatest: params => searchIndex.getLatest(params.id),
    getVersion: params => searchIndex.getVersion(params.id, params.version),
    getNamespaces,
    findOneLatest,
    findOneVersion,
    create,
    update,
    restoreState
  }
}

export default schemaModel