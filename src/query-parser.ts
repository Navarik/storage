import { Dictionary } from "@navarik/types"
import { SearchQuery } from "./types"

const castType = (value, type) => {
  if (!type){return value}
  if (type.includes('int') || type.includes('long')) {
    return Number(value)
  }
  else if (type.includes('boolean')) {
    return Boolean(value)
  }
  else return value
}

export class QueryParser {
  parse(searchParams: Dictionary<any>, schemas: object): SearchQuery {

    if (searchParams.operator && searchParams.args) {
      return <SearchQuery>searchParams
    }

    const args: Array<any> = []
    for (const field in searchParams) {
      const typeLookUp = field =="type" ? null: schemas[field]
      const value = searchParams[field]
      const term = value.operator
        ? castType(value, typeLookUp)
        : { operator: "literal", args: [castType(value, typeLookUp)] }

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
