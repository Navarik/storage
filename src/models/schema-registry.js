//@flow
import avro from 'avsc'
import map from 'poly-map'

import type { AvroSchema } from '../flowtypes'

type AvroType = Object

const registry = {}

const fullName = (schema: AvroSchema): string => {
  if (!schema.name || !schema.namespace) {
    throw new Error(`[SchemaRegistry] Both namespace and name must be provided, got name: ${schema.name}, namespace: ${schema.namespace}`)
  }

  return `${schema.namespace}.${schema.name}`
}

const validate = (type: string, data: Object): Array<Object> => {
  const errors = []
  const schema = avro.Type.forSchema(type, { registry })

  schema.isValid(data, { errorHook: (path) => { errors.push(path.join()) } })

  return errors
}

const format = (type: string, data: Object): Object => {
  const schema = avro.Type.forSchema(type, { registry })
  const response = { ...schema.fromBuffer(schema.toBuffer(data)) }

  return response
}

const formatSchema = schema => ({
  ...schema,
  type: 'record',
  description: schema.description || '',
  fields: schema.fields || []
})

const add = (schema: AvroSchema): AvroSchema => {
  const formatted = formatSchema(schema)

  avro.Type.forSchema(formatted, { registry })

  return formatted
}

const update = (schema: AvroSchema): AvroSchema => {
  const formatted = formatSchema(schema)
  const type = fullName(formatted)

  if (!registry[type]){
    throw new Error(`[SchemaRegistry] Cannot update non-existing schema: ${type}`)
  }

  delete registry[type]
  avro.Type.forSchema(formatted, { registry })

  return formatted
}

const get = (type: string): AvroType => {
  return registry[type]
}

const init = (source: ?Array<AvroSchema>) => {
  Object.keys(registry).forEach(type => { delete registry[type] })
  if (source) {
    source.forEach(add)
  }
}

const schemaRegistry = { add, update, get, format, fullName, init, validate }

export default schemaRegistry
