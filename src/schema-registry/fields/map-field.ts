import { DataField, Dictionary, SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { combineValidationResponses, isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ values: SchemaField }>
}

export class MapField implements DataField {
  private name: string
  private itemType: DataField
  private required: boolean

  constructor({ factory, path, field: { parameters, required = false } }: Config) {
    if (!parameters) {
      throw new Error("Schema: map fiedls require values parameter")
    }

    this.required = required
    this.name = path
    this.itemType = factory.create(`${path}.*`, parameters.values)
  }

  async validate(value: any, user: string) {
    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "" }
    }

    if (value instanceof Array || typeof value !== "object") {
      return { isValid: false, message: `Field ${this.name} must be an object, ${typeof value} given. ` }
    }

    const values = Object.values(value)
    const itemsValidation = await Promise.all(values.map(x => this.itemType.validate(x, user)))

    return combineValidationResponses(itemsValidation)
  }

  async hydrate(value: any, user: string) {
    if (!value) {
      return value
    }

    const result: Dictionary<any> = {}
    for (const name in value) {
      result[name] = await this.itemType.hydrate(value[name], user)
    }

    return result
  }
}
