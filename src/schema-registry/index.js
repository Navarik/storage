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
    const schema = this.get(type)
    const errors = []
    const validator = body =>
      schema.isValid(body, { errorHook: (path) => { errors.push(path.join()) } })

    if (data instanceof Array) {
      data.map(validator)
    } else {
      validator(data)
    }

    return errors
  }

  format(type, data) {
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
