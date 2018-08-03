class SchemaModel {
  constructor(changeLog, state, schemaRegistry) {
    this.changeLog = changeLog
    this.state = state
    this.schemaRegistry = schemaRegistry
  }

  async handleChange(schema) {
    this.schemaRegistry.register(schema.body)
    await this.state.set(schema)

    return schema
  }

  async init() {
    this.schemaRegistry.reset()
    this.state.reset()

    const log = await this.changeLog.reconstruct('schema')
    await Promise.all(log.map(x => this.handleChange(x)))

    this.changeLog.onChange('schema', x => this.handleChange(x))
  }

  // Commands
  async create(body) {
    if (this.schemaRegistry.exists(body.name)) {
      throw new Error(`[Storage] Attempting to create schema that already exists: ${name}.`)
    }

    const schema = this.schemaRegistry.format('schema', body)
    const transaction = this.changeLog.registerNew('schema', schema)

    return transaction
  }

  async update(name, body) {
    if (!this.state.exists(name)) {
      throw new Error(`[Storage] Attempting to update schema that doesn't exist: ${name}.`)
    }

    const previous = this.state.get(name)
    const next = this.schemaRegistry.format('schema', body)
    const transaction = this.changeLog.registerUpdate('schema', previous, next)

    return transaction
  }
}

export default SchemaModel