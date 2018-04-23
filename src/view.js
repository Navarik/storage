import avro from 'avsc'
import curry from 'curry'
import { indexBy} from './utils'
import { split, combine } from './type-naming'

const createType = combine('.')

export const formatEntity = curry((schema, data) => {
  const type = avro.Type.forSchema(schema)
  const result = type.fromBuffer(type.toBuffer(data))

  result.type = `${schema.namespace}.${schema.name}`
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
