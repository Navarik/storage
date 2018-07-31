//@flow
import avro from 'avsc'
import map from 'poly-map'

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

const formatData = (type: string, data: Object): Object => {
  const schema = avro.Type.forSchema(type, { registry })
  const response = { ...schema.fromBuffer(schema.toBuffer(data)) }

  return response
}

const format = (schema: AvroSchema) => ({
  ...schema,
  type: 'record',
  description: schema.description || '',
  fields: schema.fields || []
})

const register = (schema: AvroSchema): AvroSchema => {
  const formatted = format(schema)

  delete registry[formatted.name]
  avro.Type.forSchema(formatted, { registry })

  return formatted
}

const get = (name: string): AvroType => {
  return registry[name]
}

const init = (source: ?Array<AvroSchema>) => {
  Object.keys(registry).forEach(type => { delete registry[type] })

  if (source) {
    source.forEach(register)
  }
}

const listUserTypes = () => Object.keys(registry).filter(x => x.includes('.'))

const schemaRegistry = { format, register, get, init, validate, formatData, listUserTypes }

export default schemaRegistry
