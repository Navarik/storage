import { SchemaField, ValidatableField } from "../../types"

interface Config {
  path: string
  field: SchemaField<{ fields: Array<SchemaField> }>
}

export class PrimitiveField implements ValidatableField {
  public name: string
  public type: string

  constructor({ path, field: { type } }: Config) {
    this.name = path
    this.type = type
  }

  async validate(value: any) {
    return {
      isValid: true,
      message: ""
    }
  }
}
