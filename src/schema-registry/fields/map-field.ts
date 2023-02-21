import { Dictionary, FieldSchema } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../types"
import { combineValidationResponses, isEmpty, zip } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: FieldSchema<{ values: FieldSchema }>
}

export class MapField implements DataField {
  private name: string
  private itemType: DataField
  private required: boolean
  private default: object|null

  constructor({ factory, path, field }: Config) {
    if (!field.parameters) {
      throw new Error("Schema: map fiedls require values parameter")
    }

    this.required = field.required || false
    this.name = path
    this.default = field.default === undefined ? null : field.default
    this.itemType = factory.create(`${path}.*`, field.parameters.values)
  }

  async format(data: any, user: string) {
    const value = data === undefined ? this.default : data

    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "", value }
    }

    if (value instanceof Array || typeof value !== "object") {
      return { isValid: false, message: `Field ${this.name} must be an object, ${typeof value} given.`, value }
    }

    const keys = Object.keys(value)
    const itemsValidation = await Promise.all(keys.map(x => this.itemType.format(value[x], user)))
    const { isValid, message, value: fieldValues } = combineValidationResponses(itemsValidation)

    return {
      isValid,
      message,
      value: zip(keys, fieldValues)
    }
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
