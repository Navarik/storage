//@flow
import type { ChangelogInterface, SearchIndexInterface, AvroSchema } from './flowtypes'

class SchemaModel {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface
  state: InMemoryStateAdapter

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
    this.state = config.state
    this.schemaRegistry = config.schemaRegistry

    this.changeLog.onChange(async (schema) => {
      this.schemaRegistry.register(schema.body)
      this.state.set(schema.body.name, schema)
      await this.searchIndex.add(schema)

      return schema
    })
  }

  async init() {
    this.schemaRegistry.reset()
    this.state.reset()

    const log = await this.changeLog.reconstruct('schema')
    log.forEach((schema) => {
      this.schemaRegistry.register(schema.body)
      this.state.set(schema.body.name, schema)
    })

    await this.searchIndex.init(this.state.getAll())
  }

  // Queries
  listTypes() {
    return Object.keys(this.state.getAll())
  }

  async get(name: string, version: ?string) {
    if (!version) {
      return this.state.get(name)
    }

    return this.state.getVersion(name, version)
  }

  async find(params: Object) {
    const found = await this.searchIndex.find(params)
    if (!found) {
      return []
    }

    const schemas = found.map(x => this.state.get(x.name))

    return schemas
  }

  // Commands
  async create(body: AvroSchema) {
    if (!body || !body.name) {
      throw new Error('[Storage] Schema cannot be empty!')
    }

    if (this.state.exists(body.name)) {
      throw new Error(`[Storage] Attempting to create schema that already exists: ${name}.`)
    }

    const schema = this.schemaRegistry.format('schema', body)

    return this.changeLog.registerNew('schema', schema)
  }

  async update(name: string, body: AvroSchema) {
    if (!body || !name || !body.name) {
      throw new Error('[Storage] Schema cannot be empty!')
    }

    if (!this.state.exists(name)) {
      throw new Error(`[Storage] Attempting to update schema that doesn't exist: ${name}.`)
    }

    const previous = this.state.get(name)
    const next = this.schemaRegistry.format('schema', body)

    return this.changeLog.registerUpdate('schema', previous, next)
  }
}

export default SchemaModel