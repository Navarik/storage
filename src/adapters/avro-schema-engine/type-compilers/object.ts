import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

interface AvroRecordField {
  name: string
  type: avro.Schema
  default?: any
}

interface TypeParameters {
  fields: Array<SchemaField>
}

export class ObjectTypeCompiler implements Compiler<TypeParameters, avro.Schema> {
  static counter = 0 // Hack allowing us to ignore Avro's requirement for all records to have unique names
  private fieldCompiler: Compiler<SchemaField, AvroRecordField>

  constructor({ fieldCompiler }: { fieldCompiler: Compiler<SchemaField, AvroRecordField> }) {
    this.fieldCompiler = fieldCompiler
  }

  compile({ fields }: TypeParameters) {
    ObjectTypeCompiler.counter++

    return {
      type: "record",
      name: `Record${ObjectTypeCompiler.counter}`,
      fields: fields.map(x => this.fieldCompiler.compile(x))
    } as avro.schema.RecordType
  }
}
