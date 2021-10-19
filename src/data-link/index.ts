import { Dictionary } from "@navarik/types"
import { SchemaField, EntityRegistry, ValidationResponse } from "../types"
import { FieldFactory } from "./field-factory"

interface Config {
  state: EntityRegistry<any>
}

export class DataLink {
  private schema: Dictionary<any>
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

  async validate<BodyType extends object>(type: string, body: BodyType): Promise<ValidationResponse> {
    const typeSchema = this.schema[type]
    if (!typeSchema) {
      // No links to validate. Whatever it is, it must be valid.
      return { isValid: true, message: "" }
    }

    return typeSchema.validate(body)
  }
}
