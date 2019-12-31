import * as avro from 'avsc'
import { CanonicalSchema, SchemaField, Factory } from '../types'

type AvroFieldDefinition = {
  type: string|AvroFieldDefinition|avro.Schema
  name?: string
  items?: avro.Schema
}

export class AvroSchemaFactory implements Factory<avro.Schema> {
  private parseType(type: SchemaField, name: string): AvroFieldDefinition {
    if (type instanceof Array) {
      return {
        name,
        type: {
          type: 'array',
          items: this.create({ type: '', description: '', fields: type[0] })
        }
      }
    } else if (typeof type === 'object') {
      return {
        name,
        type: this.create({ type: '', description: '', fields: type })
      }
    } else {
      return { name, type }
    }
  }

  create(canonicalSchema: CanonicalSchema): avro.Schema {
    const fields: AvroFieldDefinition[] = []
    for (const name in canonicalSchema.fields) {
      const type = canonicalSchema.fields[name]
      if (type) {
        fields.push(this.parseType(type, name))
      }
    }

    const avro = {
      type: 'record',
      name: canonicalSchema.type,
      description: canonicalSchema.description,
      fields
    }

    return avro as avro.Schema
  }
}
