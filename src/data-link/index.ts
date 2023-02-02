import { Dictionary, SchemaField, CanonicalEntity, ValidationResponse, StorageInterface } from "../types"
import { ValidationError } from "../errors/validation-error"
import { FieldFactory } from "./field-factory"

interface Config {
  state: StorageInterface<any>
}

export interface DataField {
  validate(value: any, user: string): Promise<ValidationResponse>
  hydrate(value: any, user: string): Promise<any>
}

export class DataLink {
  private schema: Dictionary<DataField>
  private fieldFactory: FieldFactory

  constructor({ state }: Config) {
    this.fieldFactory = new FieldFactory({ state })
    this.schema = {}
  }

  registerSchema(type: string, fields: Array<SchemaField>) {
    if (!fields) {
      return
    }

    this.schema[type] = this.fieldFactory.create("body", { name: "body", type: "object", parameters: { fields } })
  }

  async validate<BodyType extends object>(type: string, body: BodyType, user: string): Promise<void> {
    const typeSchema = this.schema[type]
    if (!typeSchema) {
      // No links to validate. Whatever it is, it must be valid.
      return
    }

    const { isValid, message } = await typeSchema.validate(body, user)
    if (!isValid) {
      throw new ValidationError(message)
    }
  }

  async hydrate(entity: CanonicalEntity<any, any>, user: string) {
    const typeSchema = this.schema[entity.type]
    if (!typeSchema) {
      throw new Error(`Hydration failed: unknown type ${entity.type}`)
    }

    const body = await typeSchema.hydrate(entity.body, user)

    return { ...entity, body }
  }
}
