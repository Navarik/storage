import * as avro from 'avsc'
import { Dictionary, Map } from '@navarik/types'
import { SchemaField, Compiler } from '../../types'
import { PrimitiveTypeCompiler } from "./type-compilers/primitive"
import { LogicalTypeCompiler } from "./type-compilers/logical"
import { EnumTypeCompiler } from "./type-compilers/enum"
import { ArrayTypeCompiler } from "./type-compilers/array"
import { MapTypeCompiler } from "./type-compilers/map"
import { ObjectTypeCompiler } from "./type-compilers/object"
import { FieldCompiler } from "./field-compiler"

export class AvroTypeCompiler implements Compiler<any, avro.Schema> {
  private logicalTypes: Map<{ type: avro.schema.PrimitiveType, logicalType: string }>
  private typeCompilers: Dictionary<Compiler<any, avro.Schema>>

  constructor({ logicalTypes }) {
    this.logicalTypes = {}
    for (const type in logicalTypes) {
      this.logicalTypes[type] = { type: logicalTypes[type].baseType, logicalType: type }
    }

    const fieldCompiler = new FieldCompiler({ typeCompiler: this })

    this.typeCompilers = {
      string: new PrimitiveTypeCompiler({ type: "string" }),
      boolean: new PrimitiveTypeCompiler({ type: "boolean" }),
      int: new PrimitiveTypeCompiler({ type: "int" }),
      integer: new PrimitiveTypeCompiler({ type: "int" }),
      float: new PrimitiveTypeCompiler({ type: "float" }),
      double: new PrimitiveTypeCompiler({ type: "double" }),
      number: new PrimitiveTypeCompiler({ type: "double" }),
      any: new LogicalTypeCompiler({ baseType: "string", type: "any" }),
      datetime: new LogicalTypeCompiler({ baseType: "string", type: "datetime" }),
      reference: new LogicalTypeCompiler({ baseType: "string", type: "reference" }),
      text: new LogicalTypeCompiler({ baseType: "string", type: "text" }),
      url: new LogicalTypeCompiler({ baseType: "string", type: "url" }),
      uuid: new LogicalTypeCompiler({ baseType: "string", type: "uuid" }),
      enum: new EnumTypeCompiler(),
      array: new ArrayTypeCompiler({ root: this }),
      map: new MapTypeCompiler({ root: this }),
      object: new ObjectTypeCompiler({ fieldCompiler })
    }
  }

  compile(field: SchemaField) {
    const typeCompiler = this.typeCompilers[field.type]
    if (!typeCompiler) {
      throw new Error(`Unknown data type "${field.type}".`)
    }

    return typeCompiler.compile(field.parameters)
  }
}
