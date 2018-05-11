//@flow
import avro from 'avsc'
import logger from 'logops'
import { maybe, map, unique, liftToArray } from '../utils'

import type { AvroSchema } from '../flowtypes'

type AvroSchemaObject = Object

const registry = {}
const typeName = (schema: AvroSchema): string => `${schema.namespace}.${schema.name}`

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

const add = liftToArray((schema: AvroSchema): AvroSchema => {
  const formatted = ({
    ...schema,
    type: 'record',
    description: '',
    fields: schema.fields || []
  })

  avro.Type.forSchema(formatted, { registry })

  return formatted
})

const update = (schema: AvroSchema): void => {
  const type = typeName(schema)
  delete registry[type]
  registry[type] = avro.Type.forSchema(schema, { registry })
}

const get = (type: string): AvroSchemaObject => {
  if (!registry[type]) {
    throw new Error(`Schema not found: ${type}`)
  }

  return registry[type]
}

const schemaRegistry = { add, update, get, format, typeName }

export default schemaRegistry
