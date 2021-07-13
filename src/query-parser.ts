import { Dictionary } from "@navarik/types"
import { SearchQuery } from "./types"
export class QueryParser {

  parse(searchParams: Dictionary<any>): SearchQuery {

    if (searchParams.operator && searchParams.args) {
      return <SearchQuery>searchParams
    }

    const args: Array<any> = []
    for (const field in searchParams) {
      const value = searchParams[field]
      const term = value.operator
        ? value
        : { operator: "literal", args: [value] }

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
