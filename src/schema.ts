import { Dictionary } from '@navarik/types'
import { SchemaRegistry, SchemaEngine, CanonicalSchema, CanonicalEntity, IdGenerator } from './types'
import { ValidationError } from "./errors/validation-error"

interface Config {
  schemaRegistry: SchemaRegistry
  schemaEngine: SchemaEngine
  metaSchema: CanonicalSchema
  idGenerator: IdGenerator<CanonicalSchema>
  onChange: (schema: CanonicalSchema) => void
}

export class Schema<M extends object> {
  private idGenerator: IdGenerator<CanonicalSchema>
  private metaSchemaId: string
  private schemaRegistry: SchemaRegistry
  private schemaEngine: SchemaEngine
  private knownTypes: Dictionary<string> = {}
  private onChange: (schema: CanonicalSchema) => void

  constructor({ schemaRegistry, schemaEngine, metaSchema, idGenerator, onChange }: Config) {
    this.schemaRegistry = schemaRegistry
    this.schemaEngine = schemaEngine
    this.idGenerator = idGenerator
    this.onChange = onChange
    this.metaSchemaId = this.idGenerator.id(metaSchema)
    this.schemaEngine.register(this.metaSchemaId, metaSchema)

    this.schemaRegistry.observe(this.onRegistryUpdate.bind(this))
  }

  private onRegistryUpdate(schemaId: string, schema: CanonicalSchema) {
    this.onChange(schema)
    this.schemaEngine.register(schemaId, schema)
    this.knownTypes[schema.name] = schemaId
  }

  private validate<T = any>(schemaId: string, data: T) {
    const { isValid, message } = this.schemaEngine.validate(schemaId, data)
    if (!isValid) {
      throw new ValidationError(message)
    }
  }

  types(): Array<string> {
    return Object.keys(this.knownTypes)
  }

  define(schema: CanonicalSchema): void {
    const schemaId = this.idGenerator.id(schema)
    this.schemaRegistry.set(schemaId, schema)
  }

  describe(type: string): CanonicalSchema|undefined {
    // Provided type can be either the type name or its ID
    const schemaId = this.knownTypes[type] || type
    const schema = this.schemaRegistry.get(schemaId)

    if (!schema) {
      return undefined
    }

    return schema
  }

  describeEntity<B extends object>(entity: CanonicalEntity<B, M>): CanonicalSchema|undefined {
    // If can't find this particular version of the schema, fallback to the latest version
    const schema = this.describe(entity.schema) || this.describe(entity.type)
    if (!schema) {
      throw new ValidationError(`Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return schema
  }

  format<T = any>(type: string, body: T, meta: M) {
    const schema = this.describe(type)
    if (!schema) {
      throw new ValidationError(`Type ${type} not found.`)
    }

    const schemaId = this.idGenerator.id(schema)

    this.validate(this.metaSchemaId, meta)
    this.validate(schemaId, body)

    return {
      schema,
      schemaId,
      body: this.schemaEngine.format(schemaId, body),
      meta: this.schemaEngine.format(this.metaSchemaId, meta)
    }
  }
}
