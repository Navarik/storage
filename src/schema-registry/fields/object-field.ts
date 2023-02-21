import { Dictionary, FieldSchema } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../types"
import { combineValidationResponses, isEmpty, zip } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: FieldSchema<{ fields: Array<FieldSchema> }>
}

export class ObjectField implements DataField {
  private name: string
  private fields: Dictionary<DataField> = {}
  private required: boolean
  private default: object|null

  constructor({ factory, path, field }: Config) {
    if (!field.parameters) {
      throw new Error("Schema: object fiedls require fields parameter.")
    }

    this.required = field.required || false
    this.name = path
    this.default = field.default === undefined ? null : field.default
    for (const x of field.parameters.fields) {
      if (!this.fields[x.name]) {
        this.fields[x.name] = factory.create(`${path}.${x.name}`, x)
      }
    }
  }

  private getField(name: string) {
    const field = this.fields[name]
    if (!field) {
      throw new Error(`Schema cannot find validator for ${name}.`)
    }

    return field
  }

  async format(data: any) {
    const value = data === undefined ? this.default : data

    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "", value }
    }

    if (value instanceof Array || value === null || typeof value !== "object") {
      return { isValid: false, message: `Field ${this.name} must be an object, ${typeof value} given.`, value }
    }

    const fieldNames = Object.keys(this.fields)
    const itemsValidation = await Promise.all(fieldNames.map(x => this.getField(x).format(value[x])))
    const { isValid, message, value: fieldValues } = combineValidationResponses(itemsValidation)

    return {
      isValid,
      message,
      value: zip(fieldNames, fieldValues)
    }
  }

  async hydrate(value: any, user: string) {
    if (!value) {
      return value
    }

    const result: Dictionary<any> = {}
    for (const name in this.fields) {
      result[name] = await this.getField(name).hydrate(value[name], user)
    }

    return result
  }
}
