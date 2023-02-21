import { Dictionary, SchemaRegistryAdapter, CanonicalSchema, IdGenerator, EntityEnvelope, StorageInterface, CanonicalEntity } from '../types'
import { ValidationError } from "../errors/validation-error"
import { DataField } from './types'
import { Schema } from './schema'
import { FieldFactory } from './field-factory'

interface Config {
  registry: SchemaRegistryAdapter
  state: StorageInterface<any>
  idGenerator: IdGenerator<CanonicalSchema>
  onChange: (schema: CanonicalSchema) => void
}

export class SchemaRegistry {
  private knownTypes: Dictionary<string> = {}
  private schemas: Dictionary<DataField> = {}
  private idGenerator: IdGenerator<CanonicalSchema>
  private fieldFactory: FieldFactory
  private registry: SchemaRegistryAdapter
  private onChange: (schema: CanonicalSchema) => void

  constructor({ registry, idGenerator, onChange, state }: Config) {
    this.fieldFactory = new FieldFactory({ state })
    this.registry = registry
    this.idGenerator = idGenerator
    this.onChange = onChange

    this.registry.observe(this.onRegistryUpdate.bind(this))
  }

  private registerSchema(schemaId: string, schema: CanonicalSchema) {
    this.schemas[schemaId] = this.fieldFactory.create("body", schema.fields
      ? { name: "body", type: "object", parameters: { fields: schema.fields } }
      : { name: "body", type: "any" })
  }

  private onRegistryUpdate(schemaId: string, schema: CanonicalSchema) {
    this.knownTypes[schema.name] = schemaId
    this.registerSchema(schemaId, schema)

    this.onChange(schema)
  }

  types(): Array<string> {
    return Object.keys(this.knownTypes)
  }

  define(schema: CanonicalSchema): void {
    const schemaId = this.idGenerator.id(schema)
    this.registry.set(schemaId, schema)
    this.registerSchema(schemaId, schema)
  }

  describe(type: string): Schema|undefined {
    // Provided type can be either the type name or its ID
    const id = this.knownTypes[type] || type
    const definition = this.registry.get(id)

    if (!definition) {
      return undefined
    }

    return new Schema({ id, definition })
  }

  describeEntity(entity: EntityEnvelope): Schema {
    // If can't find this particular version of the schema, fallback to the latest version
    const schema = this.describe(entity.schema) || this.describe(entity.type)
    if (!schema) {
      throw new ValidationError(`Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return schema
  }

  async format<BodyType extends object>(type: string, body: Partial<BodyType>): Promise<BodyType> {
    const id = this.knownTypes[type] || type
    const schema = this.schemas[id]
    if (!schema) {
      throw new ValidationError(`Validation failed: type ${type} not found.`)
    }

    const { isValid, message, value } = await schema.format(body)
    if (!isValid) {
      throw new ValidationError(message)
    }

    return value
  }

  async hydrate(entity: CanonicalEntity<any, any>, user: string) {
    const typeSchema = this.schemas[entity.schema]
    if (!typeSchema) {
      throw new Error(`Hydration failed: unknown schema version ${entity.schema} (type: ${entity.type}).`)
    }

    const body = await typeSchema.hydrate(entity.body, user)

    return { ...entity, body }
  }
}
