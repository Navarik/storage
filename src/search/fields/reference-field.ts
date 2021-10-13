import { SearchableField, SchemaField, SearchQuery } from "../../types"

export class ReferenceField implements SearchableField {
  chain(field: SchemaField) {
    throw new Error("Can't chain reference types.")
  }

  merge(field: SchemaField) {
  }

  resolve(path: Array<string>, query: SearchQuery, schemaRoot: SearchableField) {
    if (path.length === 0) {
      return query
    }

    const [ field, value ] = query.args
    const nestedField = path.join(".")
    const referenceField = field.replace(`.${nestedField}`, "")
    const subquery = {
      operator: query.operator,
      args: [nestedField, value]
    }

    const result: SearchQuery = {
      operator: "in",
      args: [
        referenceField,
        {
          operator: "subquery",
          args: [schemaRoot.resolve(path, subquery, schemaRoot)]
        }
      ]
    }

    return result
  }
}
