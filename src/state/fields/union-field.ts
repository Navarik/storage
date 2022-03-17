import { Dictionary } from "@navarik/types"
import { SchemaField, SearchableField, SearchQuery } from "../../types"
import { FieldFactory } from "../field-factory"

type UnionFieldDefninition = SchemaField<{ options: Array<SchemaField> }>

export class UnionField implements SearchableField {
  private factory: FieldFactory
  private types: Dictionary<SearchableField> = {}

  constructor(factory: FieldFactory, field: UnionFieldDefninition) {
    this.factory = factory
    this.merge(field)
  }

  chain(field: SchemaField) {
    if (this.types[field.type]) {
      this.types[field.type].merge(field)
    } else {
      this.types[field.type] = this.factory.create(field)
    }
  }

  merge(field: SchemaField) {
    for (const option of field.parameters.options) {
      this.types[option.type] = this.factory.create(option)
    }
  }

  resolve(path: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    const options = Object.values(this.types).flatMap(x => x.resolve(path, query, schemaRoot))
    const validOptions = <Array<SearchQuery>>options.filter(x => x !== false)

    const result: SearchQuery = validOptions.length === 1
      ? validOptions[0]
      : {
        operator: "or",
        args: validOptions
      }

    return result
  }
}