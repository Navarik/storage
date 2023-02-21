import { Dictionary, SchemaRegistryAdapter, SchemaEngine, CanonicalSchema, IdGenerator, EntityEnvelope, StorageInterface, CanonicalEntity, DataField } from '../types'
import { ValidationError } from "../errors/validation-error"
import { Schema } from '../schema'
import { FieldFactory } from './field-factory'

interface Config {
  registry: SchemaRegistryAdapter
  engine: SchemaEngine
  state: StorageInterface<any>
  idGenerator: IdGenerator<CanonicalSchema>
  onChange: (schema: CanonicalSchema) => void
}

export class SchemaRegistry {
  private schemas: Dictionary<DataField> = {}
  private idGenerator: IdGenerator<CanonicalSchema>
  private fieldFactory: FieldFactory
  private registry: SchemaRegistryAdapter
  private engine: SchemaEngine
  private knownTypes: Dictionary<string> = {}
  private onChange: (schema: CanonicalSchema) => void

  constructor({ registry, engine, idGenerator, onChange, state }: Config) {
    this.fieldFactory = new FieldFactory({ state })
    this.registry = registry
    this.engine = engine
    this.idGenerator = idGenerator
    this.onChange = onChange

    this.registry.observe(this.onRegistryUpdate.bind(this))
  }

  private onRegistryUpdate(schemaId: string, schema: CanonicalSchema) {
    this.engine.register(schemaId, schema)
    this.knownTypes[schema.name] = schemaId

    const descriptor = schema.fields
      ? { name: "body", type: "object", parameters: { fields: schema.fields } }
      : { name: "body", type: "any" }

    this.schemas[schema.name] = this.fieldFactory.create("body", descriptor)

    this.onChange(schema)
  }

  types(): Array<string> {
    return Object.keys(this.knownTypes)
  }

  define(schema: CanonicalSchema): void {
    const schemaId = this.idGenerator.id(schema)
    this.registry.set(schemaId, schema)
  }

  describe(type: string): Schema|undefined {
    // Provided type can be either the type name or its ID
    const id = this.knownTypes[type] || type
    const definition = this.registry.get(id)

    if (!definition) {
      return undefined
    }

    return new Schema({ id, definition, engine: this.engine })
  }

  describeEntity(entity: EntityEnvelope): Schema {
    // If can't find this particular version of the schema, fallback to the latest version
    const schema = this.describe(entity.schema) || this.describe(entity.type)
    if (!schema) {
      throw new ValidationError(`Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return schema
  }

  async validate<BodyType extends object>(type: string, body: BodyType, user: string): Promise<void> {
    const typeSchema = this.schemas[type]
    if (!typeSchema) {
      throw new ValidationError(`Validation failed: type ${type} not found.`)
    }

    const { isValid, message } = await typeSchema.validate(body, user)
    if (!isValid) {
      throw new ValidationError(message)
    }
  }

  async hydrate(entity: CanonicalEntity<any, any>, user: string) {
    const typeSchema = this.schemas[entity.type]
    if (!typeSchema) {
      throw new Error(`Hydration failed: unknown type ${entity.type}`)
    }

    const body = await typeSchema.hydrate(entity.body, user)

    return { ...entity, body }
  }
}
