import * as avro from 'avsc'
import { Compiler } from '../../../types'

export class PrimitiveTypeCompiler implements Compiler<any, avro.Schema> {
  private type: string

  constructor({ type }: { type: string }) {
    this.type = type
  }

  compile() {
    return this.type
  }
}
