import { Dictionary } from "@navarik/types"
import { SchemaField, DataField } from "../../types"
import { FieldFactory } from "../field-factory"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ options: Array<SchemaField> }>
}

export class UnionField implements DataField {
  public name: string
  public types: Dictionary<DataField> = {}

  constructor({ factory, path, field: { parameters: { options } } }: Config) {
    this.name = path
    for (const option of options) {
      this.types[option.type] = factory.create(path, option)
    }
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
