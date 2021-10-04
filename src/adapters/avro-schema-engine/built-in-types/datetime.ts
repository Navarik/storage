import * as avro from 'avsc'

// Logical type that encodes native Date objects as ISO string.
export class DatetimeType extends avro.types.LogicalType {
  static baseType: avro.schema.PrimitiveType = 'string'

  _fromValue(value: string) {
    return new Date(value)
  }

  _toValue(date?: Date|string) {
    if (date === undefined) {
      return undefined
    }

    if (date instanceof Date) {
      return date.toJSON()
    }

    const value = new Date(date)
    if (date === value.toJSON()) {
      return date
    }

    return undefined
  }

  _resolve(type: avro.Type) {
    if (avro.Type.isType(type, 'long', 'string', 'logical:datetime')) {
      return this._fromValue
    } else {
      return undefined
    }
  }
}