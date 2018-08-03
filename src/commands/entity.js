import map from 'poly-map'

class EntityModel {
  constructor(changeLog, state, schemaRegistry) {
    this.changeLog = changeLog
    this.state = state
    this.schemaRegistry = schemaRegistry
  }

  async handleChange(entity) {
    await this.state.set(entity)
    return entity
  }

  async init() {
    this.state.reset()

    const types = this.schemaRegistry.listUserTypes()
    await Promise.all(types.map(async (type) => {
      const log = await this.changeLog.reconstruct(type)
      await Promise.all(log.map(x => this.handleChange({ ...x, type })))
      this.changeLog.onChange(type, x => this.handleChange({ ...x, type }))
    }))
  }

  async create(type, body) {
    const entity = this.schemaRegistry.format(type, body)
    const transaction = this.changeLog.registerNew(type, entity)

    return transaction
  }

  async update(id, body) {
    if (!this.state.exists(id)) {
      throw new Error(`[Storage] Attempting to update entity that doesn't exist: ${id}.`)
    }

    const previous = this.state.get(id)
    const next = this.schemaRegistry.format(previous.type, body)
    const transaction = this.changeLog.registerUpdate(previous.type, previous, next)

    return transaction
  }
}

export default EntityModel
