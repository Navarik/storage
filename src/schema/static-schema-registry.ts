import { SchemaRegistryAdapter, EntityType, CanonicalSchema } from "../types"
import { Dictionary } from "@navarik/types"

type SchemaRegistryConfig = {
  schemas: Array<CanonicalSchema>
}

export class StaticSchemaRegistry implements SchemaRegistryAdapter {
  private schemas: Dictionary<CanonicalSchema>

  constructor({ schemas }: SchemaRegistryConfig) {
    this.schemas = {}
    for (const schema of schemas) {
      this.schemas[schema.type] = schema
    }
  }

  list() {
    return Object.keys(this.schemas)
  }

  get(type: EntityType) {
    return this.schemas[type]
  }
}
