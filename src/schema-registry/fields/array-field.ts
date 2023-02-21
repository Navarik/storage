import { FieldSchema } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../types"
import { combineValidationResponses, isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: FieldSchema<{ items: FieldSchema }>
}

export class ArrayField implements DataField {
  private name: string
  private itemType: DataField
  private required: boolean
  private default: Array<any>|null

  constructor({ factory, path, field }: Config) {
    if (!field.parameters) {
      throw new Error("Schema: array fiedls require items parameter.")
    }

    this.name = path
    this.required = field.required || false
    this.default = field.default === undefined ? null : field.default
    this.itemType = factory.create(`${path}.*`, field.parameters.items)
  }

  async format(data: any) {
    const value = data === undefined ? this.default : data

    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "", value }
    }

    if (!(value instanceof Array)) {
      return { isValid: false, message: `Field ${this.name} must be an array, ${typeof value} given.`, value }
    }

    const itemsValidation = await Promise.all(value.map(x => this.itemType.format(x)))

    return combineValidationResponses(itemsValidation)
  }

  async hydrate(value: Array<any>, user: string) {
    if (!value) {
      return value
    }

    return Promise.all(value.map(x => this.itemType.hydrate(x, user)))
  }
}
