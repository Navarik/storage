import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

export class PrimitiveTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  compile(field: SchemaField) {
    return {
      type: field.required ? field.type : ["null", field.type]
    } as avro.Schema
  }
}
