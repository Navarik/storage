import { Dictionary, SchemaField } from "../../types"
import { FieldFactory } from "../field-factory"
import { DataField } from "../index"

interface Config {
  factory: FieldFactory
  path: string
  field: SchemaField<{ options: Array<SchemaField> }>
}

export class UnionField implements DataField {
  public name: string
  public types: Dictionary<DataField> = {}

  constructor({ factory, path, field: { parameters } }: Config) {
    if (!parameters) {
      throw new Error("DataLink: union fiedls require options parameter")
    }

    this.name = path
    for (const option of parameters.options) {
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
