import { Dictionary, SchemaField, SearchableField, SearchQuery } from "../../types"
import { UnionField } from "./union-field"

type ObjectFieldDefinition = SchemaField<{ fields: Array<SchemaField> }>

export class ObjectField implements SearchableField {
  private fields: Dictionary<UnionField> = {}

  constructor(field: ObjectFieldDefinition) {
    this.merge(field)
  }

  chain(field: SchemaField) {
    if (!this.fields[field.name]) {
      this.fields[field.name] = new UnionField({
        name: field.name,
        type: "union",
        parameters: { options: [] }
      })
    }

    this.fields[field.name]?.chain(field)
  }

  merge(field: SchemaField) {
    for (const nestedField of field.parameters?.fields) {
      this.chain(nestedField)
    }
  }

  resolve([head, ...tail]: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    if (typeof head !== "string" || !this.fields[head]) {
      return false
    }

    const descriptors = this.fields[head]?.resolve(tail, query, schemaRoot) || false

    return descriptors
  }
}
