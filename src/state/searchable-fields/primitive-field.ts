import { Dictionary, FieldSchema, SearchableField, SearchQuery } from "../../types"
import { CompilerError } from "../../errors/compiler-error"

type TypeConvertor<T, G> = (x: T) => G

const typeConvertors: Dictionary<TypeConvertor<any, any>> = {
  int: parseInt,
  float: parseFloat,
  double: parseFloat,
  string: (x: any) => `${x}`,
  datetime: (x: any) => new Date(x)
}
const defaultTypeConvertor = (x: any) => x

export class PrimitiveField implements SearchableField {
  public type: string
  private convertor: TypeConvertor<any, any>

  constructor(field: FieldSchema) {
    this.type = field.type
    this.convertor = typeConvertors[this.type] || defaultTypeConvertor
  }

  chain(field: FieldSchema) {
    throw new CompilerError("Can't chain primitive types")
  }

  merge(field: FieldSchema) {
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
