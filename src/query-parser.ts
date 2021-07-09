import { Dictionary } from "@navarik/types"
import { SearchQuery } from "./types"

const dataTypes = {
  double: (value) => Number(value),
  int: (value) => Number(value),
  float: (value) => Number(value),
  long: (value) => Number(value),
  boolean: (value) => Boolean(value)
}

const castType = (value, type) => {
  if (!type) {
    return value
  }
  const castFunction = dataTypes[type.split(',')[0]]
  return castFunction ? castFunction(value) : value
}

export class QueryParser {
  private schemas: object

  constructor(schemas) {
    this.schemas = schemas
  }

  parse(searchParams: Dictionary<any>): SearchQuery {

    if (searchParams.operator && searchParams.args) {
      return <SearchQuery>searchParams
    }

    const args: Array<any> = []
    for (const field in searchParams) {
      const typeLookUp = !(field in this.schemas) ? null : this.schemas[field]
      const value = castType(searchParams[field], typeLookUp)
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
