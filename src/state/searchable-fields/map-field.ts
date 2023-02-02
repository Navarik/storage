import { SchemaField, SearchableField, SearchQuery } from "../../types"
import { createField } from "."

type MapFieldDefinition = SchemaField<{ values: SchemaField }>

export class MapField implements SearchableField {
  private items: SearchableField

  constructor(field: MapFieldDefinition) {
    if (!field.parameters) {
      throw new Error("DeepSearch: map fiedls require items parameter")
    }

    this.items = createField(field.parameters.values)
  }

  chain(field: SchemaField) {}

  merge(field: SchemaField) {}

  resolve([head, ...tail]: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    if (typeof head !== "string") {
      return false
    }

    return this.items.resolve(tail, query, schemaRoot)
  }
}
