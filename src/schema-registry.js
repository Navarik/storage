import avro from 'avsc'
import { maybe, indexBy, map, unique, pipe } from './utils'

const registry = {}
const createType = schema => `${schema.namespace}.${schema.name}`

const formatEntity = (entity) => {
  const schema = get(entity.type)
  const data = schema.fromBuffer(schema.toBuffer(entity))

  data.type = entity.type
  data.version = entity.version
  data.id = entity.id
  data.version_id = entity.version_id
  data.created_at = entity.created_at
  data.modified_at = entity.modified_at

  return { data, schema }
}

const formatCollection = (collection) => {
  const entities = map(formatEntity, collection)
  const response = { data: [], schema: [] }

  for (let next of entities) {
    response.data.push(next.data)
    response.schema.push(next.schema)
  }

  response.schema = unique(response.schema)

  return response
}

export const register = (schema) => (schema instanceof Array
  ? map(register, schema)
  : registry[createType(schema)] = avro.Type.forSchema(schema, { registry })
)

export const get = (type) => {
  if (!registry[type]) {
    throw new Error(`Schema not found: ${type}`)
  }

  return registry[type]
}

export const format = maybe(data => (
  data instanceof Array
    ? formatCollection(data)
    : formatEntity(data)
  )
)
