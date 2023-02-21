import isUrl from "is-url"
import isUuid from "is-uuid"
import { Dictionary, FieldSchema } from "../../types"
import { DataField } from "../types"
import { isEmpty } from "./utils"

type TypeValidator = (x: any) => boolean

interface Config {
  path: string
  field: FieldSchema<{}>
}

const typeValidators: Dictionary<TypeValidator> = {
  string: (x: any) => typeof x === "string",
  boolean: (x: any) => typeof x === "boolean",
  int: (x: any) => typeof x === "number" && Math.floor(x) === x,
  integer: (x: any) => typeof x === "number" && Math.floor(x) === x,
  float: (x: any) => typeof x === "number",
  double: (x: any) => typeof x === "number",
  number: (x: any) => typeof x === "number",
  datetime: (x: any) => x instanceof Date,
  text: (x: any) => typeof x === "string",
  url: isUrl,
  uuid: (x: any) => isUuid.anyNonNil(x)
}

export class PrimitiveField implements DataField {
  private name: string
  private type: string
  private validator: (x: any) => boolean
  private required: boolean
  private default: any

  constructor({ path, field }: Config) {
    const validator = typeValidators[field.type]
    if (!validator) {
      throw new Error(`Schema: type ${field.type} is not supported.`)
    }

    this.type = field.type
    this.validator = validator
    this.required = field.required || false
    this.default = field.default === undefined ? null : field.default
    this.name = path
  }

  async format(data: any) {
    const value = data === undefined ? this.default : data

    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.`, value }
        : { isValid: true, message: "", value }
    }

    const isValid = this.validator(value)

    return {
      isValid,
      message: isValid ? "" : `Field ${this.name} must be a ${this.type}, ${typeof value} is given.`,
      value
    }
  }

  async hydrate(value: any) {
    return value
  }
}
