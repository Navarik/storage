import { DataField, SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { combineValidationResponses, isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ items: SchemaField }>
}

export class ArrayField implements DataField {
  private name: string
  private itemType: DataField
  private required: boolean

  constructor({ factory, path, field: { parameters, required = false } }: Config) {
    if (!parameters) {
      throw new Error("Schema: array fiedls require items parameter.")
    }

    this.name = path
    this.required = required
    this.itemType = factory.create(`${path}.*`, parameters.items)
  }

  async validate(value: any, user: string) {
    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "" }
    }

    if (!(value instanceof Array)) {
      return { isValid: false, message: `Field ${this.name} must be an array, ${typeof value} given.` }
    }

    const itemsValidation = await Promise.all(value.map(x => this.itemType.validate(x, user)))

    return combineValidationResponses(itemsValidation)
  }

  async hydrate(value: Array<any>, user: string) {
    if (!value) {
      return value
    }

    return Promise.all(value.map(x => this.itemType.hydrate(x, user)))
  }
}
