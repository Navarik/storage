import { DataField, SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ options: Array<SchemaField> }>
}

export class UnionField implements DataField {
  private name: string
  private types: Array<DataField>
  private required: boolean

  constructor({ factory, path, field: { parameters, required = false } }: Config) {
    if (!parameters) {
      throw new Error("Schema: union fiedls require options parameter.")
    }

    this.required = required
    this.name = path
    this.types = parameters.options.map(x => factory.create(path, x))
  }

  async validate(value: any, user: string) {
    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.` }
        : { isValid: true, message: "" }
    }

    for (const validator of this.types) {
      const validationResult = await validator.validate(value, user)
      if (validationResult.isValid) {
        return validationResult
      }
    }

    return { isValid: false, message: `Field ${this.name} is a union type, but ${value} is not valid for any of the options.` }
  }

  async hydrate(value: any) {
    return value
  }
}
