import * as avro from 'avsc'
const isUrl = require('is-url')

// An valid URL
export class UrlType extends avro.types.LogicalType {
  static baseType: avro.schema.PrimitiveType = 'string'

  _fromValue(value: string) {
    return value
  }

  _toValue(string?: string) {
    if (string === undefined) {
      return undefined
    }

    if (!isUrl(string)) {
      return undefined
    }

    return string
  }

  _resolve(type: avro.Type) {
    if (avro.Type.isType(type, 'string', 'logical:url', 'logical:text')) {
      return this._fromValue
    } else {
      return undefined
    }
  }
}