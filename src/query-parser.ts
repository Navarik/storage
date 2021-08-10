import { Dictionary } from "@navarik/types"
import { SearchQuery } from "./types"

export class QueryParser {
  private createValueTerm(value) {
    const term = (typeof value === "object") && value && value.operator
      ? value
      : { operator: "literal", args: [value] }

    return term
  }


  parse(searchParams: Dictionary<any>): SearchQuery {
    if (searchParams.operator && searchParams.args) {
      return <SearchQuery>searchParams
    }

    const args: Array<any> = []
    for (const field in searchParams) {
      const value = searchParams[field]
      const term = this.createValueTerm(value)

      args.push({
        operator: "eq",
        args: [field, term]
      })
    }

    const query: SearchQuery = {
      operator: "and",
      args
    }

    return query
  }
}
