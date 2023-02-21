import isUrl from "is-url"
import isUuid from "is-uuid"
import { Dictionary, DataField, SchemaField } from "../../types"
import { isEmpty } from "./utils"

type TypeValidator = (x: any) => boolean

interface Config {
  path: string
  field: SchemaField<{}>
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

  constructor({ path, field: { type, required = false } }: Config) {
    const validator = typeValidators[type]
    if (!validator) {
      throw new Error(`Schema: type ${type} is not supported.`)
    }

    this.type = type
    this.validator = validator
    this.required = required
    this.name = path
  }

  async validate(value: any) {
    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.` }
        : { isValid: true, message: "" }
    }

    const isValid = this.validator(value)

    return {
      isValid,
      message: isValid ? "" : `Field ${this.name} must be a ${this.type}, ${typeof value} is given.`
    }
  }

  async hydrate(value: any) {
    return value
  }
}
