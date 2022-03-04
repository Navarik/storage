import { SearchableField, SchemaField, SearchQuery } from "../../types"
import { CompilerError } from "../../errors/compiler-error"

export class ReferenceField implements SearchableField {
  chain(field: SchemaField) {
    throw new CompilerError("Can't chain reference types.")
  }

  merge(field: SchemaField) {
    if (field.type !== "reference") {
      throw new CompilerError(`Can't merge fields of different primitive types reference and ${field.type}`)
    }
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
