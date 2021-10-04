import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

export class LogicalTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  private baseType: avro.schema.PrimitiveType

  constructor({ baseType }: { baseType: avro.schema.PrimitiveType }) {
    this.baseType = baseType
  }

  compile(field: SchemaField) {
    const basicType = { type: this.baseType, logicalType: field.type }

    const type = field.required
      ? basicType
      : { type: ["null", basicType] }

    return type as avro.Schema
  }
}
