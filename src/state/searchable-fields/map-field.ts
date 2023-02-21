import { FieldSchema, SearchableField, SearchQuery } from "../../types"
import { createField } from "."

type MapFieldDefinition = FieldSchema<{ values: FieldSchema }>

export class MapField implements SearchableField {
  private items: SearchableField

  constructor(field: MapFieldDefinition) {
    if (!field.parameters) {
      throw new Error("DeepSearch: map fiedls require items parameter")
    }

    this.items = createField(field.parameters.values)
  }

  chain(field: FieldSchema) {}

  merge(field: FieldSchema) {}

  resolve([head, ...tail]: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    if (typeof head !== "string") {
      return false
    }

    return this.items.resolve(tail, query, schemaRoot)
  }
}
