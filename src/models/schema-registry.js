//@flow
import avro from 'avsc'
import { map, unique, liftToArray } from '../utils'

import registry from './built-in-types.json'

import type { AvroSchema } from '../flowtypes'

type AvroSchemaObject = Object

const typeName = (schema: AvroSchema): string => {
  if (!schema.name || !schema.namespace) {
    throw new Error(`[SchemaRegistry] Both namespace and name must be provided, got name: ${schema.name}, namespace: ${schema.namespace}`)
  }

  return `${schema.namespace}.${schema.name}`
}

const format = liftToArray((type, data) => {
  const schema = get(type)
  const response = schema.fromBuffer(schema.toBuffer(data))

  return response
})

const formatSchema = schema => ({
  ...schema,
  type: 'record',
  description: schema.description || '',
  fields: schema.fields || []
})

const add = liftToArray((schema: AvroSchema): AvroSchema => {
  const formatted = formatSchema(schema)

  avro.Type.forSchema(formatted, { registry })

  return formatted
})

const update = (schema: AvroSchema): AvroSchema => {
  const formatted = formatSchema(schema)
  const type = typeName(formatted)

  if (!registry[type]){
    throw new Error(`[SchemaRegistry] Cannot update non-existing schema: ${type}`)
  }

  delete registry[type]
  registry[type] = avro.Type.forSchema(formatted, { registry })

  return formatted
}

const get = (type: string): AvroSchemaObject => {
  if (!registry[type]) {
    throw new Error(`[SchemaRegistry] Schema not found for ${type}`)
  }

  return registry[type]
}

const schemaRegistry = { add, update, get, format, typeName }

export default schemaRegistry
