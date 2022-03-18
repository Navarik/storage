import { Dictionary } from "@navarik/types"
import { SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../index"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ fields: Array<SchemaField> }>
}

export class ObjectField implements DataField {
  private name: string
  private fields: Dictionary<DataField> = {}

  constructor({ factory, path, field: { parameters: { fields } } }: Config) {
    this.name = path
    for (const field of fields) {
      if (!this.fields[field.name]) {
        this.fields[field.name] = factory.create(`${path}.${field.name}`, field)
      }
    }
  }

  async validate(value: any, user: string) {
    if (value === undefined || value === null) {
      return { isValid: true, message: "" }
    }

    if (value instanceof Array || typeof value !== "object") {
      return { isValid: false, message: `Field ${this.name} must be an object, ${typeof value} given. ` }
    }

    let isValid = true, message = ""
    for (const fieldName in this.fields) {
      const fieldValidation = await this.fields[fieldName].validate(value[fieldName], user)
      isValid &&= fieldValidation.isValid
      message += fieldValidation.message
    }

    return { isValid, message }
  }

  async hydrate(value: any, user: string) {
    if (!value) {
      return value
    }

    const result = {}
    for (const name in this.fields) {
      result[name] = await this.fields[name].hydrate(value[name], user)
    }

    return result
  }
}
