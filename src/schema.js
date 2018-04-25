import uuidv5 from 'uuid/v5'
import { head, liftToArray, map, get, unique } from './utils'
import SearchIndex from './ports/search-index'
import schemaRegistry from './ports/schema-registry'
import ChangeLog from './ports/change-log'

// Configuration
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'

// Models
const searchIndex = new SearchIndex({
  format: liftToArray(schema => schemaRegistry.get(schemaRegistry.typeName(schema)))
})

const changeLog = new ChangeLog({
  // Generate same ID for the same schema names
  idGenerator: body => uuidv5(schemaRegistry.typeName(body), UUID_ROOT),
  topic: 'entity'
})

// Queries
export const findLatest = params => searchIndex.findLatest(params)
export const findVersions = params => searchIndex.findVersions(params)

export const getLatest = params => searchIndex.getLatest(params.id)
export const getVersion = params => searchIndex.getVersion(params.id, params.version)

export const getNamespaces = params =>
  searchIndex.findLatest({}).then(map(get('namespace'))).then(unique)

export const findOneLatest = params => searchIndex.findLatest(params).then(head)
export const findOneVersion = params => searchIndex.findVersions(params).then(head)

// Commands
const searchableFormat = schema => {
  const result = {
    id: schema.id,
    name: schema.name,
    namespace: schema.namespace,
  }

  for (let field of schema.fields) {
    result[field.name] = String(field.type)
  }

  return result
}

export const create = liftToArray(async (body) => {
  await schemaRegistry.add(body)

  const schema = await changeLog.logNew(body)
  await searchIndex.add(searchableFormat(schema))

  return schema
})

export const update = async (id, body) => {
  await schemaRegistry.update(body) // 'version' is not avro-compliant

  const schema = await changeLog.logChange({ ...body, id })
  await searchIndex.add(searchableFormat(schema))

  return schema
}
