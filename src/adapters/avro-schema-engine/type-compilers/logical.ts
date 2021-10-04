import * as avro from 'avsc'
import { Compiler } from '../../../types'

export class LogicalTypeCompiler implements Compiler<any, avro.Schema> {
  private type: string
  private baseType: avro.schema.PrimitiveType

  constructor({ type, baseType }: { type: string, baseType: avro.schema.PrimitiveType }) {
    this.type = type
    this.baseType = baseType
  }

  compile() {
    return { type: this.baseType, logicalType: this.type }
  }
}
