import avro from 'avsc'
import { indexBy, map } from '../utils'

const registry = {}
const createType = schema => `${schema.namespace}.${schema.name}`

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

export const formatEntity = (entity) => {
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

export const formatCollection = (schemata, entities) => {
  const schemaIndex = indexBy(createType, schemata)
  const collection = entities.map(x => formatEntity(schemaIndex[x.type], x))

  return collection
}
