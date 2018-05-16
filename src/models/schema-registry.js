//@flow
import avro from 'avsc'
import { map, unique, liftToArray } from '../utils'
import builtIns from './built-in-types.json'

import type { AvroSchema } from '../flowtypes'

type AvroSchemaObject = Object

const registry = {}

const fullName = (schema: AvroSchema): string => {
  if (!schema.name || !schema.namespace) {
    throw new Error(`[SchemaRegistry] Both namespace and name must be provided, got name: ${schema.name}, namespace: ${schema.namespace}`)
  }

  return `${schema.namespace}.${schema.name}`
}

const format = (type: string, data: Object): Object => {
  const schema = avro.Type.forSchema(type, { registry })
  const response = schema.fromBuffer(schema.toBuffer(data))

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

const get = (type: string): AvroSchemaObject => {
  return registry[type]
}

const init = () => {
  Object.keys(registry).forEach(type => { delete registry[type] })
  map(add, builtIns)
}

init()

const schemaRegistry = { add, update, get, format, fullName, init }

export default schemaRegistry
