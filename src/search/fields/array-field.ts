import { SchemaField, SearchableField, SearchQuery } from "../../types"
import { FieldFactory } from "../field-factory"
import { UnionField } from "./union-field"

type ArrayFieldDefinition = SchemaField<{ items: SchemaField }>

export class ArrayField implements SearchableField {
  private items: UnionField

  constructor(factory: FieldFactory, field: ArrayFieldDefinition) {
    this.items = new UnionField(factory, {
      name: field.name,
      type: "union",
      parameters: { options: [] }
    })
    this.items.chain(field.parameters.items)
  }

  chain(field: SchemaField) {

  }

  merge(field: SchemaField) {

  }

  resolve([head, ...tail]: Array<string>, query: SearchQuery) {
    if (head !== "*") {
      return false
    }

    return this.items.resolve(tail, query)
  }
}
