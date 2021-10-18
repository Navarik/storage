import { Dictionary } from "@navarik/types"
import { SchemaField, ValidatableField } from "../../types"
import { FieldFactory } from "../field-factory"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ fields: Array<SchemaField> }>
}

export class ObjectField implements ValidatableField {
  private name: string
  private fields: Dictionary<ValidatableField> = {}

  constructor({ factory, path, field: { parameters: { fields } } }: Config) {
    this.name = path
    for (const field of fields) {
      if (!this.fields[field.name]) {
        this.fields[field.name] = factory.create(`${path}.${field.name}`, field)
      }
    }
  }

  async validate(value: any) {
    if (value instanceof Array && typeof value !== "object") {
      return { isValid: false, message: `Field "${this.name} must be an object, ${typeof value} given. ` }
    }

    let isValid = true, message = ""
    for (const fieldName in this.fields) {
      const fieldValidation = await this.fields[fieldName].validate(value[fieldName])
      isValid &&= fieldValidation.isValid
      message += fieldValidation.message
    }

    return { isValid, message }
  }
}
