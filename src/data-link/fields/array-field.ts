import { SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../index"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ items: SchemaField }>
}

export class ArrayField implements DataField {
  private name: string
  private items: DataField

  constructor({ factory, path, field: { parameters: { items } } }: Config) {
    this.name = path
    this.items = factory.create(`${path}.*`, items)
  }

  async validate(value: any, user: string) {
    if (value === undefined || value === null) {
      return { isValid: true, message: "" }
    }

    if (!(value instanceof Array)) {
      return { isValid: false, message: `Field ${this.name} must be an array, ${typeof value} given. ` }
    }

    const itemsValidation = await Promise.all(value.map(x => this.items.validate(x, user)))
    let isValid = true, message = ""
    for (const itemValidation of itemsValidation) {
      isValid &&= itemValidation.isValid
      message += itemValidation.message
    }

    return { isValid, message }
  }

  async hydrate(value: any, user: string) {
    if (!value) {
      return value
    }

    return Promise.all(value.map(x => this.items.hydrate(x, user)))
  }
}
