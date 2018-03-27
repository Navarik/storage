import avro from 'avsc'
import curry from 'curry'

const enforceSchema = curry((schema, data) => {
  const type = avro.Type.forSchema(schema)
  const result = type.fromBuffer(type.toBuffer(data))

  result.type = `${schema.namespace}.${schema.name}`
  result.version = data.version
  result.id = data.id
  result.version_id = data.version_id

  return result
})

export default enforceSchema
