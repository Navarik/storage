import { Dictionary } from '@navarik/types'
import { SchemaRegistry, SchemaEngine, CanonicalSchema, CanonicalEntity, IdGenerator } from './types'
import { ValidationError } from "./errors/validation-error"

interface Config {
  schemaRegistry: SchemaRegistry
  schemaEngine: SchemaEngine
  metaSchema: CanonicalSchema
  idGenerator: IdGenerator<CanonicalSchema>
}

export class Schema<M extends object> {
  public metaSchema: CanonicalSchema
  private idGenerator: IdGenerator<CanonicalSchema>
  private metaSchemaId: string
  private schemaRegistry: SchemaRegistry
  private schemaEngine: SchemaEngine
  private knownTypes: Dictionary<string> = {}

  constructor({ schemaRegistry, schemaEngine, metaSchema, idGenerator }: Config) {
    this.schemaRegistry = schemaRegistry
    this.schemaEngine = schemaEngine
    this.idGenerator = idGenerator
    this.metaSchema = metaSchema
    this.metaSchemaId = this.idGenerator.id(this.metaSchema)
    this.schemaEngine.register(this.metaSchemaId, this.metaSchema)

    this.schemaRegistry.observe(this.onRegistryUpdate.bind(this))
  }

  private onRegistryUpdate(schemaId: string, schema: CanonicalSchema) {
    this.schemaEngine.register(schemaId, schema)
    this.knownTypes[schema.name] = schemaId
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
    const schema = this.schemaRegistry.get(entity.schema) || this.schemaRegistry.get(entity.type)
    if (!schema) {
      throw new ValidationError(`Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return schema
  }

  validate<T = any>(type: string, body: T, meta: M) {
    if (!type) {
      return { isValid: false, message: "Type must be provided.", schema: null, schemaId: null }
    }

    const schema = this.describe(type)
    if (!schema) {
      return { isValid: false, message: `Type "${type}" not found.`, schema: null, schemaId: null }
    }

    const schemaId = this.idGenerator.id(schema)

    const metaValidationResult = this.schemaEngine.validate(this.metaSchemaId, meta || {})
    if (!metaValidationResult.isValid) {
      return { ...metaValidationResult, schema, schemaId }
    }

    return { ...this.schemaEngine.validate(schemaId, body), schema, schemaId }
  }

  format<T = any>(type: string, body: T, meta: M) {
    const { isValid, message, schema, schemaId } = this.validate(type, body, meta)
    if (!isValid) {
      throw new ValidationError(message)
    }

    return {
      schema,
      schemaId,
      body: this.schemaEngine.format(schemaId, body),
      meta: this.schemaEngine.format(this.metaSchemaId, meta || {})
    }
  }
}
