import { SearchableField, SchemaField, SearchQuery } from "../../types"

export class ReferenceField implements SearchableField {
  chain(field: SchemaField) {
    throw new Error("Can't chain reference types.")
  }

  merge(field: SchemaField) {
  }

  resolve(path: Array<string>, query: SearchQuery) {
    if (path.length === 0) {
      return query
    }

    const [ field, value ] = query.args
    const nestedField = path.join(".")
    const referenceField = field.replace(`.${nestedField}`, "")

    const result: SearchQuery = {
      operator: "in",
      args: [
        referenceField,
        {
          operator: "subquery",
          args: [{
            operator: query.operator,
            args: [nestedField, value]
          }]
        }
      ]
    }

    return result
  }
}
