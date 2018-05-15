//@flow
import avro from 'avsc'
import logger from 'logops'
import { maybe, map, unique, liftToArray } from '../utils'

import registry from './built-in-types.json'

import type { AvroSchema } from '../flowtypes'

type AvroSchemaObject = Object

const typeName = (schema: AvroSchema): string => {
  if (!schema.name || !schema.namespace) {
    throw new Error(`[SchemaRegistry] Both namespace and name must be provided, got name: ${schema.name}, namespace: ${schema.namespace}`)
  }

  return `${schema.namespace}.${schema.name}`
}

const format = maybe(liftToArray((data) => {
  let schema

  try {
    schema = get(data.type)
  } catch (e) {
    logger.error({ message: `Schema not found for ${data.type}`, details: data })
    throw e
  }

  const response = {
    id: data.id,
    version: data.version,
    version_id: data.version_id,
    type: data.type,
    created_at: data.created_at,
    modified_at: data.modified_at,

    payload: schema.fromBuffer(schema.toBuffer(data)),
    schema
  }

  return response
}))

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
    throw new Error(`Schema not found: ${type}`)
  }

  return registry[type]
}

const schemaRegistry = { add, update, get, format, typeName }

export default schemaRegistry
