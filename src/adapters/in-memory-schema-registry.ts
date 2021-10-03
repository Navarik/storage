import { Dictionary } from "@navarik/types"
import { SchemaRegistry, CanonicalSchema } from "../types"

export class InMemorySchemaRegistry implements SchemaRegistry {
  private schemas: Dictionary<CanonicalSchema> = {}

  set(key: string, schema: CanonicalSchema) {
    this.schemas[key] = schema
  }

  get(key: string) {
    return this.schemas[key]
  }
}
