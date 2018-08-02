//@flow
import uuidv5 from 'uuid/v5'
import { head, maybe } from './utils'
import schemaRegistry from './ports/schema-registry'
import SignatureProvider from './ports/signature-provider'

import type { SignatureProviderInterface, ChangelogInterface, SearchIndexInterface, AvroSchema } from './flowtypes'

// Generate same IDs for the each name + namespace combination
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const generateId = (body: Object) => uuidv5(body.name, UUID_ROOT)

class SchemaModel {
  searchIndex: SearchIndexInterface
  changeLog: ChangelogInterface
  signature: SignatureProviderInterface
  state: InMemoryStateAdapter

  constructor(config: Object) {
    this.searchIndex = config.searchIndex
    this.changeLog = config.changeLog
    this.state = config.state
    this.signature = new SignatureProvider(generateId)

    this.changeLog.onChange(async (schema) => {
      schemaRegistry.register(schema.body)
      this.state.set(schema.body.name, schema)
      await this.searchIndex.add(schema)

      return schema
    })
  }

  async init() {
    let log = await this.changeLog.reconstruct('schema')
    log = log.map(record => (record.id ? record : this.signature.signNew(record)))

    this.state.reset()
    log.forEach((schema) => {
      schemaRegistry.register(schema.body)
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

    const schema = schemaRegistry.format(body)
    const record = this.signature.signNew(schema)

    return this.changeLog.register('schema', record)
  }

  async update(name: string, body: AvroSchema) {
    if (!body || !name || !body.name) {
      throw new Error('[Storage] Schema cannot be empty!')
    }

    if (!this.state.exists(name)) {
      throw new Error(`[Storage] Attempting to update schema that doesn't exist: ${name}.`)
    }

    const schema = schemaRegistry.format(body)
    const previous = this.state.get(name)
    const next = this.signature.signVersion(schema, previous)
    if (previous.version_id === next.version_id) {
      return previous
    }

    return this.changeLog.register('schema', next)
  }
}

export default SchemaModel