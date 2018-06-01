//@flow
import avro from 'avsc'
import map from 'poly-map'
import curry from 'curry'

import type { AvroSchema } from '../flowtypes'

type AvroType = Object

const registry = {}

const validate = (type: string, data: Object|Array<Object>): Array<Object> => {
  const errors = []
  const schema = avro.Type.forSchema(type, { registry })
  const validator = body =>
    schema.isValid(body, { errorHook: (path) => { errors.push(path.join()) } })

  if (data instanceof Array) {
    data.map(validator)
  } else {
    validator(data)
  }

  return errors
}

const format = curry((type: string, data: Object): Object => {
  const schema = avro.Type.forSchema(type, { registry })
  const response = { ...schema.fromBuffer(schema.toBuffer(data)) }

  return response
})

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
  const type = formatted.name

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

const listAllTypes = (): Array<string> => Object.keys(registry)
const listUserTypes = (): Array<string> => listAllTypes().filter(x => x.includes('.'))

const init = (source: ?Array<AvroSchema>) => {
  listAllTypes().forEach(type => { delete registry[type] })
  if (source) {
    source.forEach(add)
  }
}

const schemaRegistry = { add, update, get, format, init, validate, listAllTypes, listUserTypes }

export default schemaRegistry
