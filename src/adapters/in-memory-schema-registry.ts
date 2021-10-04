import { Dictionary } from "@navarik/types"
import { SchemaRegistry, CanonicalSchema } from "../types"

export class InMemorySchemaRegistry implements SchemaRegistry {
  private schemas: Dictionary<CanonicalSchema> = {}
  private observer: (key: string, schema: CanonicalSchema) => void

  set(key: string, schema: CanonicalSchema) {
    this.schemas[key] = schema
    if (this.observer) {
      this.observer(key, schema)
    }
  }

  get(key: string) {
    return this.schemas[key]
  }

  observe(observer) {
    this.observer = observer
  }
}
