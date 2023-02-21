import { DataField, SchemaField } from "../../types"
import { isEmpty } from "./utils"

interface Config {
  path: string
  field: SchemaField<{ options: Array<any> }>
}

export class EnumField implements DataField {
  private name: string
  private options: Array<any>
  private required: boolean

  constructor({ path, field: { parameters, required = false } }: Config) {
    if (!parameters) {
      throw new Error("Schema: enu, fiedls require options parameter.")
    }

    this.required = required
    this.name = path
    this.options = parameters.options
  }

  async validate(value: any, user: string) {
    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.` }
        : { isValid: true, message: "" }
    }

    for (const option of this.options) {
      if (option === value) {
        return { isValid: true, message: "" }
      }
    }

    return { isValid: false, message: `Field ${this.name} must contain one of the following values: ${this.options.join(", ")}, ${value} is given.` }
  }

  async hydrate(value: any) {
    return value
  }
}
