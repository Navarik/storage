import * as avro from 'avsc'
import { Compiler } from '../../../types'

interface TypeParameters {
  options: Array<string>
}

export class EnumTypeCompiler implements Compiler<TypeParameters, avro.Schema> {
  static counter = 0 // Hack allowing us to ignore Avro's requirement for all enums to have unique names

  compile({ options }: TypeParameters) {
    EnumTypeCompiler.counter++

    return {
      type: "enum",
      name: `Enum${EnumTypeCompiler.counter}`,
      symbols: options.map(x => x.trim())
    } as avro.schema.EnumType
  }
}
