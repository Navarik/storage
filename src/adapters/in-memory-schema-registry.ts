import { Dictionary, SchemaRegistryAdapter, CanonicalSchema } from "../types"

type SchemaObserver = (key: string, schema: CanonicalSchema) => void

export class InMemorySchemaRegistry implements SchemaRegistryAdapter {
  private schemas: Dictionary<CanonicalSchema> = {}
  private observer: SchemaObserver|undefined

  set(key: string, schema: CanonicalSchema) {
    this.schemas[key] = schema
    if (this.observer) {
      this.observer(key, schema)
    }
  }

  get(key: string) {
    return this.schemas[key]
  }

  observe(observer: SchemaObserver) {
    this.observer = observer
  }
}
