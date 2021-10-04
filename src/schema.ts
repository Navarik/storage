import { Dictionary } from '@navarik/types'
import { v5 as uuidv5 } from 'uuid'
import { SchemaRegistry, SchemaEngine, CanonicalSchema, CanonicalEntity } from './types'
import { ValidationError } from "./errors/validation-error"

interface Config {
  schemaRegistry: SchemaRegistry
  schemaEngine: SchemaEngine
  metaSchema: CanonicalSchema
}

const UUID_ROOT = '00000000-0000-0000-0000-000000000000'

export class Schema<M extends object> {
  public metaSchema: CanonicalSchema
  private schemaRegistry: SchemaRegistry
  private schemaEngine: SchemaEngine
  private knownTypes: Dictionary<string> = {}

  constructor({ schemaRegistry, schemaEngine, metaSchema }: Config) {
    this.schemaRegistry = schemaRegistry
    this.schemaEngine = schemaEngine
    this.metaSchema = metaSchema
  }

  private generateId(schema: CanonicalSchema) {
    return uuidv5(JSON.stringify(schema), UUID_ROOT)
  }

  types(): Array<string> {
    return Object.keys(this.knownTypes)
  }

  define(schema: CanonicalSchema): void {
    const schemaId = this.generateId(schema)
    this.schemaRegistry.set(schemaId, schema)
    this.knownTypes[schema.name] = schemaId
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
      return { isValid: false, message: "Type must be provided.", schema: null }
    }

    const schema = this.describe(type)
    if (!schema) {
      return { isValid: false, message: `Type "${type} not found.`, schema: null }
    }

    const metaValidationResult = this.schemaEngine.validate(this.metaSchema, meta)
    if (!metaValidationResult.isValid) {
      return { ...metaValidationResult, schema }
    }

    return { ...this.schemaEngine.validate(schema, body), schema }
  }

  format<T = any>(type: string, body: T, meta: M) {
    const { isValid, message, schema } = this.validate(type, body, meta)
    if (!isValid) {
      throw new ValidationError(message)
    }

    return {
      schema,
      schemaId: this.generateId(schema),
      body: this.schemaEngine.format(schema, body),
      meta: this.schemaEngine.format(this.metaSchema, meta || {})
    }
  }
}
