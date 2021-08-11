import { Dictionary } from "@navarik/types"
import { SearchQuery } from "./types"

export class QueryParser {
  private createTerm(field, value) {
    const term = (typeof value === "object") && value && value.operator
      ? value
      : { operator: "eq", args: [field, value] }

    return term
  }


  parse(searchParams: Dictionary<any>): SearchQuery {
    if (searchParams.operator && searchParams.args) {
      return <SearchQuery>searchParams
    }

    const args: Array<any> = []
    for (const field in searchParams) {
      const value = searchParams[field]
      args.push(this.createTerm(field, value))
    }

    const query: SearchQuery = {
      operator: "and",
      args
    }

    return query
  }
}
