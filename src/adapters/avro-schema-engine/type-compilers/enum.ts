import * as avro from 'avsc'
import { SchemaField, Compiler } from '../../../types'

export class EnumTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  static counter = 0 // Hack allowing us to ignore Avro's requirement for all enums to have unique names

  compile(field: SchemaField<{ options: Array<string> }>) {
    EnumTypeCompiler.counter++

    return {
      type: "enum",
      name: `Enum${EnumTypeCompiler.counter}`,
      symbols: field.parameters.options.map(x => x.trim())
    } as avro.schema.EnumType
  }
}
