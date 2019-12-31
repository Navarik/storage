import * as avro from 'avsc'
import { EntityBody, EntityType, ValidationResponse, Factory, SchemaRegistryAdapter } from '../types'
import { AvroSchemaFactory } from './avro-schema-factory'

type AvroSchemaEngineConfig = {
  registry: SchemaRegistryAdapter
}

type AvroRegistry = { [name: string]: avro.Type }

export class AvroSchemaEngine {
  private schemaFactory: Factory<avro.Schema>
  private avroTypes: AvroRegistry
  private registry: SchemaRegistryAdapter

  constructor({ registry }: AvroSchemaEngineConfig) {
    this.registry = registry
    this.schemaFactory = new AvroSchemaFactory()
    this.avroTypes = {}
  }

  private getAvroType(type: string) {
    if (!this.avroTypes[type]) {
      const canonicalSchema = this.registry.get(type)
      if (!canonicalSchema) {
        return undefined
      }

      const avroSchema = this.schemaFactory.create(canonicalSchema)
      this.avroTypes[type] = avro.Type.forSchema(avroSchema)
    }

    return this.avroTypes[type]
  }

  validate(type: EntityType, data: EntityBody): ValidationResponse {
    const avroType = this.getAvroType(type)
    if (!avroType) {
      return {
        isValid: false,
        message: `Unknown type: ${type}`
      }
    }

    const errors: Array<string> = []
    avroType.isValid(data, { errorHook: (path) => { errors.push(path.join()) } })

    if (errors.length) {
      return {
        isValid: false,
        message: `Invalid value provided for: ${errors.join(', ')}`
      }
    } else {
      return {
        isValid: true,
        message: ''
      }
    }
  }

  format(type: EntityType, data: EntityBody): EntityBody {
    const avroType = this.getAvroType(type)
    if (!avroType) {
      throw new Error(`[Storage] Unknown type: ${type}`)
    }

    const response = { ...avroType.fromBuffer(avroType.toBuffer(data)) }

    return response
  }
}
