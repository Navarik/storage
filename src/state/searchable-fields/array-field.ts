import { FieldSchema, SearchableField, SearchQuery } from "../../types"
import { UnionField } from "./union-field"

type ArrayFieldDefinition = FieldSchema<{ items: FieldSchema }>

export class ArrayField implements SearchableField {
  private items: UnionField

  constructor(field: ArrayFieldDefinition) {
    if (!field.parameters) {
      throw new Error("DeepSearch: array fiedls require items parameter")
    }

    this.items = new UnionField({
      name: field.name,
      type: "union",
      parameters: { options: [] }
    })
    this.items.chain(field.parameters.items)
  }

  chain(field: FieldSchema) {}

  merge(field: FieldSchema) {}

  resolve([head, ...tail]: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    if (head !== "*") {
      return false
    }

    return this.items.resolve(tail, query, schemaRoot)
  }
}
