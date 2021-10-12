import { SearchableField, SearchQuery, QueryLinker } from "../../types"
import { ValidationError } from "../../errors/validation-error"

export class FieldLinker implements QueryLinker {
  private searchSchema: SearchableField

  constructor({ searchSchema }) {
    this.searchSchema = searchSchema
  }

  link(query: SearchQuery) {
    const field = query.args[0]
    const linkedQuery = this.searchSchema.resolve(field.split("."), query)

    if (!linkedQuery) {
      throw new ValidationError(`Unrecognized field: ${field}.`)
    }

    return linkedQuery
  }
}
