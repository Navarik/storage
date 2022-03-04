import { SearchableField, SearchQuery, QueryCompiler } from "../../types"
import { ValidationError } from "../../errors/validation-error"

export class FieldCompiler implements QueryCompiler<SearchQuery> {
  private searchSchema: SearchableField

  constructor({ searchSchema }) {
    this.searchSchema = searchSchema
  }

  compile(query: SearchQuery) {
    const field = query.args[0]
    const linkedQuery = this.searchSchema.resolve(field.split("."), query, this.searchSchema)

    if (!linkedQuery) {
      throw new ValidationError(`Unrecognized field: ${field}`)
    }

    return linkedQuery
  }
}
