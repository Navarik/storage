import { Dictionary } from "@navarik/types"
import * as avro from 'avsc'
import { SchemaField, Compiler } from "../../types"

interface AvroRecordField {
  name: string
  type: avro.Schema
  default?: any
}

export class FieldCompiler implements Compiler<SchemaField, AvroRecordField> {
  private typeCompiler: Compiler<SchemaField, avro.Schema>
  private dataTypeConverters: Dictionary<(x: string) => any> = {
    other: x => x,
    boolean: x => x === "true",
    int: parseInt,
    float: parseFloat,
    double: parseFloat,
    datetime: x => new Date(x)
  }

  constructor({ typeCompiler }: { typeCompiler: Compiler<SchemaField, avro.Schema> }) {
    this.typeCompiler = typeCompiler
  }

  private getDefaultValue(field: SchemaField) {
    if (!field.required && field.default === undefined) {
      return "null"
    }

    const convert = this.dataTypeConverters[field.type] || this.dataTypeConverters.other

    return convert(field.default)
  }

  compile(field: SchemaField) {
    return {
      name: field.name,
      type: this.typeCompiler.compile(field),
      default: this.getDefaultValue(field)
    }
  }
}
