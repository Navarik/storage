import { Dictionary } from "@navarik/types"
import { SearchOperator, SearchQuery } from "./types"

export class QueryParser {
  private createTerm(field, value) {
    const term = (typeof value === "object") && value && value.operator
      ? value
      : { operator: "eq", args: [ field, value ] }

    return term
  }


  parse(searchParams: Dictionary<any>): SearchQuery|undefined {
    if (!searchParams) {
      return undefined
    }

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

  merge(operator: SearchOperator, queries: Array<SearchQuery|undefined>): SearchQuery {
    const cleanSet = queries.filter(x => x !== undefined)
    if (cleanSet.length === 0) {
      return { operator: "noop", args: [] }
    }

    if (cleanSet.length === 1) {
      return cleanSet[0]
    }

    return {
      operator,
      args: cleanSet
    }
  }
}
