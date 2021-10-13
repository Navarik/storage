import { SchemaField, SearchableField } from "../../types"
import { FieldFactory } from "../field-factory"

export class PrimitiveField implements SearchableField {
  public type: string

  constructor(factory: FieldFactory, field: SchemaField) {
    this.type = field.type
  }

  chain(field: SchemaField) {
    throw new Error("Can't chain primitive types.")
  }

  merge(field: SchemaField) {
  }

  resolve(path: Array<string>, query, schemaRoot: SearchableField) {
    if (path.length > 0) {
      return false
    }

    return query
  }
}
