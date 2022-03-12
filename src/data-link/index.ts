import { Dictionary } from "@navarik/types"
import { SchemaField, ValidationResponse, CanonicalEntity, DataField } from "../types"
import { State } from "../state"
import { FieldFactory } from "./field-factory"

interface Config {
  state: State<any>
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

  async validate<BodyType extends object>(type: string, body: BodyType, user: string): Promise<ValidationResponse> {
    const typeSchema = this.schema[type]
    if (!typeSchema) {
      // No links to validate. Whatever it is, it must be valid.
      return { isValid: true, message: "" }
    }

    return typeSchema.validate(body, user)
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
