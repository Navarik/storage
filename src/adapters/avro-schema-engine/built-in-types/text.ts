import * as avro from 'avsc'

// A variant of the string type just in  case.
// For example, @navarik/storage elasticsearch adapter enables full-text search only for this type
export class TextType extends avro.types.LogicalType {
  static baseType: avro.schema.PrimitiveType = 'string'

  _fromValue(value: string) {
    return value
  }

  _toValue(string?: string) {
    return string
  }

  _resolve(type: avro.Type) {
    if (avro.Type.isType(type, 'string', 'logical:text', 'logical:reference', 'logical:url')) {
      return this._fromValue
    } else {
      return undefined
    }
  }
}