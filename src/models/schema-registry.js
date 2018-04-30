import avro from 'avsc'
import logger from 'logops'
import { maybe, map, unique, liftToArray } from '../utils'

const registry = {}
const typeName = schema => `${schema.namespace}.${schema.name}`

const formatEntity = (entity) => {
  let schema

  try {
    schema = get(entity.type)
  } catch (e) {
    logger.error({ message: `Schema not found for ${entity.type}`, details: entity })
    throw e
  }

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

const add = liftToArray(schema =>
  avro.Type.forSchema(schema, { registry })
)

const update = (schema) => {
  const type = typeName(schema)
  delete registry[type]
  registry[type] = avro.Type.forSchema(schema, { registry })
}

const get = (type) => {
  if (!registry[type]) {
    throw new Error(`Schema not found: ${type}`)
  }

  return registry[type]
}

const format = maybe(data => (
  data instanceof Array
    ? formatCollection(data)
    : formatEntity(data)
  )
)

const schemaRegistry = { add, update, get, format, typeName }

export default schemaRegistry
