import { SchemaField, SearchableField, SearchQuery } from "../../types"
import { FieldFactory } from "../field-factory"

type MapFieldDefinition = SchemaField<{ values: SchemaField }>

export class MapField implements SearchableField {
  private items: SearchableField

  constructor(factory: FieldFactory, field: MapFieldDefinition) {
    if (!field.parameters) {
      throw new Error("DeepSearch: map fiedls require items parameter")
    }

    this.items = factory.create(field.parameters.values)
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
