import avro from 'avsc'

class SchemaRegistry {
  constructor() {
    this.registry = {}
    this.types = []
  }

  register(schema) {
    delete this.registry[schema.name]
    avro.Type.forSchema(schema, { registry: this.registry })

    if (!this.types.includes(schema.name)) {
      this.types.push(schema.name)
    }
  }

  exists(name) {
    return this.types.includes(name)
  }

  get(name) {
    const schema = avro.Type.forSchema(name, { registry: this.registry })

    return schema
  }

  reset() {
    Object.keys(this.registry).forEach(type => { delete this.registry[type] })
    this.types = []
  }

  listUserTypes() {
    return this.types
  }

  validate(type, data) {
    if (type === 'schema') {
      if (!data || !data.name) {
        return '[Storage] Schema cannot be empty!'
      }
    } else {
      if (!this.exists(type)) {
        return `[Storage] Unknown type: ${type}`
      }

      const errors = []
      this.get(type).isValid(data, { errorHook: (path) => { errors.push(path.join()) } })
      if (errors.length) {
        return `[Storage] Invalid value provided for: ${errors.join(', ')}`
      }
    }

    return ''
  }

  isValid(type, body) {
    const validationErrors = this.validate(type, body)
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  format(type, data) {
    const validationError = this.validate(type, data)
    if (validationError) {
      throw new Error(validationError)
    }

    if (type === 'schema') {
      return {
        ...data,
        type: 'record',
        description: data.description || '',
        fields: data.fields || []
      }
    }

    const schema = this.get(type)
    const response = { ...schema.fromBuffer(schema.toBuffer(data)) }

    return response
  }
}

export default SchemaRegistry
