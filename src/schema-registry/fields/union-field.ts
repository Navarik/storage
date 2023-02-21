import { FieldSchema } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../types"
import { isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: FieldSchema<{ options: Array<FieldSchema> }>
}

export class UnionField implements DataField {
  private name: string
  private types: Array<DataField>
  private required: boolean
  private default: any

  constructor({ factory, path, field }: Config) {
    if (!field.parameters) {
      throw new Error("Schema: union fiedls require options parameter.")
    }

    this.required = field.required || false
    this.name = path
    this.default = field.default === undefined ? null : field.default
    this.types = field.parameters.options.map((x: FieldSchema) => factory.create(path, x))
  }

  async format(data: any, user: string) {
    const value = data === undefined ? this.default : data

    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.`, value }
        : { isValid: true, message: "", value }
    }

    for (const validator of this.types) {
      const validationResult = await validator.format(value, user)
      if (validationResult.isValid) {
        return validationResult
      }
    }

    return {
      isValid: false,
      message: `Field ${this.name} is a union type, but ${value} is not valid for any of the options.`,
      value
    }
  }

  async hydrate(value: any) {
    return value
  }
}
