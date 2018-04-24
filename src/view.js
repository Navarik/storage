import avro from 'avsc'
import { indexBy, curry } from './utils'

const createType = schema => `${schema.namespace}.${schema.name}`

export const formatEntity = curry((schema, data) => {
  const type = avro.Type.forSchema(schema)
  const result = type.fromBuffer(type.toBuffer(data))

  result.type = createType(schema)
  result.version = data.version
  result.id = data.id
  result.version_id = data.version_id
  result.created_at = data.created_at
  result.modified_at = data.modified_at

  return result
})

export const formatCollection = (schemata, entities) => {
  const schemaIndex = indexBy(createType, schemata)
  const collection = entities.map(x => formatEntity(schemaIndex[x.type], x))

  return collection
}
