import { SchemaField, SearchableField } from "../../types"
import { CompilerError } from "../../errors/compiler-error"
import { FieldFactory } from "../field-factory"

export class PrimitiveField implements SearchableField {
  public type: string

  constructor(factory: FieldFactory, field: SchemaField) {
    this.type = field.type
  }

  chain(field: SchemaField) {
    throw new CompilerError("Can't chain primitive types")
  }

  merge(field: SchemaField) {
    if (field.type !== this.type) {
      throw new CompilerError(`Can't merge fields of different primitive types ${this.type} and ${field.type}`)
    }
  }

  resolve(path: Array<string>, query) {
    if (path.length > 0) {
      return false
    }

    return query
  }
}
