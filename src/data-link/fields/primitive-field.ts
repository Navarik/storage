import { DataField, SchemaField } from "../../types"

interface Config {
  path: string
  field: SchemaField<{}>
}

export class PrimitiveField implements DataField {
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

  async hydrate(value: any) {
    return value
  }
}
