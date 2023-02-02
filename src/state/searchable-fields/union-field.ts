import { Dictionary, SchemaField, SearchableField, SearchQuery } from "../../types"
import { createField } from "."

type UnionFieldDefninition = SchemaField<{ options: Array<SchemaField> }>

export class UnionField implements SearchableField {
  private types: Dictionary<SearchableField> = {}

  constructor(field: UnionFieldDefninition) {
    this.merge(field)
  }

  chain(field: SchemaField) {
    if (this.types[field.type]) {
      this.types[field.type]?.merge(field)
    } else {
      this.types[field.type] = createField(field)
    }
  }

  merge(field: SchemaField) {
    if (!field.parameters) {
      throw new Error("DeepSearch: union fiedls require options parameter")
    }

    for (const option of field.parameters.options) {
      this.types[option.type] = createField(option)
    }
  }

  resolve(path: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    const options = Object.values(this.types).flatMap(x => x?.resolve(path, query, schemaRoot))
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
