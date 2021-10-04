import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

export class MapTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  private root: Compiler<SchemaField, avro.Schema>

  constructor({ root }: { root: Compiler<SchemaField, avro.Schema> }) {
    this.root = root
  }

  compile(field: SchemaField<{ values: Array<SchemaField> }>) {
    return {
      type: 'map',
      values: field.parameters.values.map(x => this.root.compile(x))
    } as avro.schema.MapType
  }
}
