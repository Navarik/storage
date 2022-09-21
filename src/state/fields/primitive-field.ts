import { SchemaField, SearchableField, SearchQuery } from "../../types"
import { CompilerError } from "../../errors/compiler-error"
import { FieldFactory } from "../field-factory"

const typeConvertors = {
  int: parseInt,
  float: parseFloat,
  double: parseFloat,
  string: x => `${x}`,
  datetime: x => new Date(x),
  default: x => x
}

export class PrimitiveField implements SearchableField {
  public type: string
  private convertor: (x: any) => any

  constructor(factory: FieldFactory, field: SchemaField) {
    this.type = field.type
    this.convertor = typeConvertors[this.type] || typeConvertors.default
  }

  chain(field: SchemaField) {
    throw new CompilerError("Can't chain primitive types")
  }

  merge(field: SchemaField) {
    if (field.type !== this.type) {
      throw new CompilerError(`Can't merge fields of different primitive types ${this.type} and ${field.type}`)
    }
  }

  resolve(path: Array<string>, query: SearchQuery) {
    if (path.length > 0) {
      return false
    }

    const { operator, args: [field, value, ...rest] } = query
    const formattedValue = value instanceof Array
      ? value.map(x => this.convertor(x))
      : this.convertor(value)

    return { operator, args: [field, formattedValue, ...rest] }
  }
}
