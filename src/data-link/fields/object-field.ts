import { DataField, Dictionary, SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { combineValidationResponses, isEmpty } from "./utils"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ fields: Array<SchemaField> }>
}

export class ObjectField implements DataField {
  private name: string
  private fields: Dictionary<DataField> = {}
  private required: boolean

  constructor({ factory, path, field: { parameters, required = false } }: Config) {
    if (!parameters) {
      throw new Error("DataLink: object fiedls require fields parameter.")
    }

    this.required = required
    this.name = path
    for (const field of parameters.fields) {
      if (!this.fields[field.name]) {
        this.fields[field.name] = factory.create(`${path}.${field.name}`, field)
      }
    }
  }

  private getField(name: string) {
    const field = this.fields[name]
    if (!field) {
      throw new Error(`DataLink cannot find validator for ${name}.`)
    }

    return field
  }

  async validate(value: any, user: string) {
    if (!this.required && isEmpty(value)) {
      return { isValid: true, message: "" }
    }

    if (value instanceof Array || value === null || typeof value !== "object") {
      return { isValid: false, message: `Field ${this.name} must be an object, ${typeof value} given. ` }
    }

    const fieldNames = Object.keys(this.fields)
    const itemsValidation = await Promise.all(fieldNames.map(x => this.getField(x).validate(value[x], user)))

    return combineValidationResponses(itemsValidation)
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
