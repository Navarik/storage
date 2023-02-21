import { SearchableField, FieldSchema, SearchQuery } from "../../types"
import { CompilerError } from "../../errors/compiler-error"

export class ReferenceField implements SearchableField {
  chain(field: FieldSchema) {
    throw new CompilerError("Can't chain reference types.")
  }

  merge(field: FieldSchema) {
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
      operator: "subquery",
      args: [
        referenceField,
        schemaRoot.resolve(path, subquery, schemaRoot)
      ]
    }

    return result
  }
}
