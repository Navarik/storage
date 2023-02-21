import { FieldSchema } from "../../types"
import { DataField } from "../types"
import { isEmpty } from "./utils"

interface Config {
  path: string
  field: FieldSchema<{}>
}

export class AnyField implements DataField {
  private default: any

  constructor({ field }: Config) {
    this.default = field.default === undefined ? null : field.default
  }

  async format(value: any) {
    return {
      isValid: true,
      message: "",
      value: isEmpty(value) ? this.default : value
    }
  }

  async hydrate(value: any) {
    return value
  }
}
