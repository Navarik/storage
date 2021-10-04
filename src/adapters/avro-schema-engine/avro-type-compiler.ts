import * as avro from 'avsc'
import { Dictionary, Map } from '@navarik/types'
import { SchemaField, Compiler } from '../../types'
import { PrimitiveTypeCompiler } from "./type-compilers/primitive"
import { LogicalTypeCompiler } from "./type-compilers/logical"
import { EnumTypeCompiler } from "./type-compilers/enum"
import { ArrayTypeCompiler } from "./type-compilers/array"
import { MapTypeCompiler } from "./type-compilers/map"

export class AvroTypeCompiler implements Compiler<SchemaField, avro.Schema> {
  private logicalTypes: Map<{ type: avro.schema.PrimitiveType, logicalType: string }>
  private typeCompilers: Dictionary<Compiler<SchemaField, avro.Schema>>

  constructor(logicalTypes) {
    this.logicalTypes = {}
    for (const type in logicalTypes) {
      this.logicalTypes[type] = { type: logicalTypes[type].baseType, logicalType: type }
    }

    this.typeCompilers = {
      string: new PrimitiveTypeCompiler(),
      boolean: new PrimitiveTypeCompiler(),
      int: new PrimitiveTypeCompiler(),
      float: new PrimitiveTypeCompiler(),
      double: new PrimitiveTypeCompiler(),
      any: new LogicalTypeCompiler({ baseType: "string" }),
      datetime: new LogicalTypeCompiler({ baseType: "string" }),
      reference: new LogicalTypeCompiler({ baseType: "string" }),
      text: new LogicalTypeCompiler({ baseType: "string" }),
      url: new LogicalTypeCompiler({ baseType: "string" }),
      uuid: new LogicalTypeCompiler({ baseType: "string" }),
      enum: new EnumTypeCompiler(),
      array: new ArrayTypeCompiler({ root: this }),
      map: new MapTypeCompiler({ root: this })
    }
  }

  compile(field: SchemaField) {
    const typeCompiler = this.typeCompilers[field.type]
    if (!typeCompiler) {
      throw new Error(`Unknown data type "${field.type}".`)
    }

    return typeCompiler.compile(field)
  }
}
