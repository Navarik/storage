import { SchemaField, DataField } from "../../types"
import { FieldFactory } from "../field-factory"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ values: SchemaField }>
}

export class MapField implements DataField {
  private name: string
  private items: DataField

  constructor({ factory, path, field: { parameters: { values } } }: Config) {
    this.name = path
    this.items = factory.create(`${path}.*`, values)
  }

  async validate(value: any) {
    if (value === undefined || value === null) {
      return { isValid: true, message: "" }
    }

    if (value instanceof Array || typeof value !== "object") {
      return { isValid: false, message: `Field "${this.name} must be an object, "${typeof value}" given. ` }
    }

    const values = Object.values(value)
    const itemsValidation = await Promise.all(values.map(x => this.items.validate(x)))
    let isValid = true, message = ""
    for (const itemValidation of itemsValidation) {
      isValid &&= itemValidation.isValid
      message += itemValidation.message
    }

    return { isValid, message }
  }

  async hydrate(value: any) {
    if (!value) {
      return value
    }

    const result = {}
    for (const name in value) {
      result[name] = await this.items.hydrate(value[name])
    }

    return result
  }
}
