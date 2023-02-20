import { Dictionary, SchemaRegistryAdapter, SchemaEngine, CanonicalSchema, IdGenerator, EntityEnvelope } from './types'
import { ValidationError } from "./errors/validation-error"
import { SchemaType } from './schema-type'

interface Config {
  adapter: SchemaRegistryAdapter
  engine: SchemaEngine
  idGenerator: IdGenerator<CanonicalSchema>
  onChange: (schema: CanonicalSchema) => void
}

export class SchemaRegistry {
  private idGenerator: IdGenerator<CanonicalSchema>
  private adapter: SchemaRegistryAdapter
  private engine: SchemaEngine
  private knownTypes: Dictionary<string> = {}
  private onChange: (schema: CanonicalSchema) => void

  constructor({ adapter, engine, idGenerator, onChange }: Config) {
    this.adapter = adapter
    this.engine = engine
    this.idGenerator = idGenerator
    this.onChange = onChange

    this.adapter.observe(this.onRegistryUpdate.bind(this))
  }

  private onRegistryUpdate(schemaId: string, schema: CanonicalSchema) {
    this.onChange(schema)
    this.engine.register(schemaId, schema)
    this.knownTypes[schema.name] = schemaId
  }

  types(): Array<string> {
    return Object.keys(this.knownTypes)
  }

  define(schema: CanonicalSchema): void {
    const schemaId = this.idGenerator.id(schema)
    this.adapter.set(schemaId, schema)
  }

  describe(type: string): SchemaType|undefined {
    // Provided type can be either the type name or its ID
    const id = this.knownTypes[type] || type
    const definition = this.adapter.get(id)

    if (!definition) {
      return undefined
    }

    return new SchemaType({ id, definition, engine: this.engine })
  }

  describeEntity(entity: EntityEnvelope): SchemaType {
    // If can't find this particular version of the schema, fallback to the latest version
    const schema = this.describe(entity.schema) || this.describe(entity.type)
    if (!schema) {
      throw new ValidationError(`Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return schema
  }
}
