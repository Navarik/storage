import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

interface TypeParameters {
  values: SchemaField
}

export class MapTypeCompiler implements Compiler<TypeParameters, avro.Schema> {
  private root: Compiler<SchemaField, avro.Schema>

  constructor({ root }: { root: Compiler<SchemaField, avro.Schema> }) {
    this.root = root
  }

  compile({ values }: TypeParameters) {
    return {
      type: 'map',
      values: this.root.compile(values)
    } as avro.schema.MapType
  }
}
