import * as avro from 'avsc'

// Any type
export class AnyType extends avro.types.LogicalType {
  static baseType: avro.schema.PrimitiveType = 'string'

  _fromValue(value: string) {
    if (value === null || value === undefined) {
      return value
    }

    return JSON.parse(value)
  }

  _toValue(string?: any) {
    if (string === null || string === undefined) {
      return string
    }

    return JSON.stringify(string)
  }

  _resolve(type: avro.Type) {
    return this._fromValue
  }
}