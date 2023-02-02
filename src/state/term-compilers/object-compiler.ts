import { Dictionary, SearchQuery, QueryCompiler, SearchableField } from "../../types"
import { ValidationError } from "../../errors/validation-error"

export class ObjectCompiler implements QueryCompiler<Dictionary<any>> {
  private searchSchema: SearchableField

  constructor({ searchSchema }: { searchSchema: SearchableField }) {
    this.searchSchema = searchSchema
  }

  compile(query: Dictionary<any>) {
    const args: Array<SearchQuery> = []

    for (const field in query) {
      const fieldPath = field.split(".")
      const condition = this.searchSchema.resolve(fieldPath, {
        operator: "eq",
        args: [field, query[field]]
      }, this.searchSchema)

      if (!condition) {
        throw new ValidationError(`Unrecognized field: ${field}`)
      }

      args.push(condition)
    }

    const result: SearchQuery = {
      operator: "and",
      args
    }

    return result
  }
}
