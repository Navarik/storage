import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

export class ArrayTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  private root: Compiler<SchemaField, avro.Schema>

  constructor({ root }: { root: Compiler<SchemaField, avro.Schema> }) {
    this.root = root
  }

  compile(field: SchemaField<{ items: Array<SchemaField> }>) {
    return {
      type: 'array',
      items: field.parameters.items.map(x => this.root.compile(x))
    } as avro.schema.ArrayType
  }
}
