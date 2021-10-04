import { Dictionary, Document } from "@navarik/types"
import * as avro from "avsc"
import { ValidationResponse, CanonicalSchema, SchemaEngine } from "../../types"
import { AvroTypeCompiler } from "./avro-type-compiler"
import { builtInTypes } from "./built-in-types"
import { FieldCompiler } from "./field-compiler"

export class AvroSchemaEngine implements SchemaEngine {
  private typeCompiler: AvroTypeCompiler
  private fieldCompiler: FieldCompiler
  private avroTypes: Dictionary<avro.Type>

  constructor() {
    this.avroTypes = {}
    this.typeCompiler = new AvroTypeCompiler({ logicalTypes: builtInTypes })
    this.fieldCompiler = new FieldCompiler({ typeCompiler: this.typeCompiler })
  }

  private getAvroType(type: string) {
    const avroType = this.avroTypes[type]
    if (!avroType) {
      throw new Error(`Schema not found for type "${type}".`)
    }

    return avroType
  }

  register(type: string, schema: CanonicalSchema) {
    const avroSchema = {
      type: "record",
      fields: schema.fields.map(x => this.fieldCompiler.compile(x))
    } as avro.schema.RecordType

    this.avroTypes[type] = avro.Type.forSchema(
      avroSchema,
      {
        logicalTypes: builtInTypes,
        registry: this.avroTypes
      }
    )
  }

  validate(type: string, data: Document): ValidationResponse {
    const avroType = this.getAvroType(type)
    const errors: Array<string> = []
    avroType.isValid(
      data,
      {
        errorHook: (path: Array<string>) => {
          errors.push(path.join())
        }
      }
    )

    if (errors.length) {
      return {
        isValid: false,
        message: `Invalid value provided for: ${errors.join(", ")}`
      }
    }

    return {
      isValid: true,
      message: ""
    }
  }

  format<T = Document>(type: string, data: T): T {
    const { isValid, message } = this.validate(type, data)
    if (!isValid) {
      throw new Error(message)
    }

    const avroType = this.getAvroType(type)
    const response = { ...avroType.fromBuffer(avroType.toBuffer(data)) }

    return response
  }
}
