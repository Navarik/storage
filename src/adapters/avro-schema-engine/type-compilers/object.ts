import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

interface AvroRecordField {
  name: string
  type: avro.Schema
  default?: any
}

export class ObjectTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  static counter = 0 // Hack allowing us to ignore Avro's requirement for all records to have unique names
  private fieldCompiler: Compiler<SchemaField, AvroRecordField>

  constructor({ fieldCompiler }: { fieldCompiler: Compiler<SchemaField, AvroRecordField> }) {
    this.fieldCompiler = fieldCompiler
  }

  compile(field: SchemaField<{ fields: Array<SchemaField> }>) {
    return {
      type: "record",
      name: `Record${ObjectTypeCompiler.counter}`,
      fields: field.parameters.fields.map(x => this.fieldCompiler.compile(x))
    } as avro.schema.RecordType
  }
}
