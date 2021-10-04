import * as avro from "avsc"
import { SchemaField, Compiler } from "../../../types"

interface TypeParameters {
  items: SchemaField
}

export class ArrayTypeCompiler implements Compiler<TypeParameters, avro.Schema> {
  private root: Compiler<SchemaField, avro.Schema>

  constructor({ root }: { root: Compiler<SchemaField, avro.Schema> }) {
    this.root = root
  }

  compile({ items }: TypeParameters) {
    return {
      type: "array",
      items: this.root.compile(items)
    } as avro.schema.ArrayType
  }
}
