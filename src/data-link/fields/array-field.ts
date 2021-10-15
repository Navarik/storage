import { SchemaField, ValidatableField } from "../../types"
import { FieldFactory } from "../field-factory"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ items: SchemaField }>
}

export class ArrayField implements ValidatableField {
  private name: string
  private items: ValidatableField

  constructor({ factory, path, field: { parameters: { items } } }: Config) {
    this.name = path
    this.items = factory.create(`${path}.*`, items)
  }

  async validate(value: any) {
    if (!(value instanceof Array)) {
      return { isValid: false, message: `Field "${this.name} must be an array, ${typeof value} given. ` }
    }

    const itemsValidation = await Promise.all(value.map(x => this.items.validate(x)))
    let isValid = true, message = ""
    for (const itemValidation of itemsValidation) {
      isValid &&= itemValidation.isValid
      message += itemValidation.message
    }

    return { isValid, message }
  }
}
