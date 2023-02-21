import { FieldSchema } from "../../types"
import { DataField } from "../types"
import { isEmpty } from "./utils"

interface Config {
  path: string
  field: FieldSchema<{ options: Array<any> }>
}

export class EnumField implements DataField {
  private name: string
  private options: Array<any>
  private required: boolean
  private default: any

  constructor({ path, field }: Config) {
    if (!field.parameters) {
      throw new Error("Schema: enu, fiedls require options parameter.")
    }

    this.required = field.required || false
    this.name = path
    this.default = field.default === undefined ? null : field.default
    this.options = field.parameters.options
  }

  async format(data: any) {
    const value = data === undefined ? this.default : data

    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.`, value }
        : { isValid: true, message: "", value }
    }

    for (const option of this.options) {
      if (option === value) {
        return { isValid: true, message: "", value }
      }
    }

    return {
      isValid: false,
      message: `Field ${this.name} must contain one of the following values: ${this.options.join(", ")}, ${value} is given.`,
      value
    }
  }

  async hydrate(value: any) {
    return value
  }
}
