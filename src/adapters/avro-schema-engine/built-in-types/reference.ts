import * as avro from 'avsc'
import * as isUuid from 'is-uuid'

// An id of some other object. A value of this type must be a valid UUID string
export class ReferenceType extends avro.types.LogicalType {
  static baseType: avro.schema.PrimitiveType = 'string'

  _fromValue(value: string) {
    return value
  }

  _toValue(string?: string) {
    if (string === undefined) {
      return undefined
    }

    if (!isUuid.anyNonNil(string)) {
      return undefined
    }

    return string
  }

  _resolve(type: avro.Type) {
    if (avro.Type.isType(type, 'string', 'logical:reference', 'logical:text')) {
      return this._fromValue
    } else {
      return undefined
    }
  }
}