import { Compiler } from "./compiler"
import { Filter, SearchQuery } from "./types"

export const compiler = new Compiler()

export const objectFilter = <T extends object = object>(query: SearchQuery|object): Filter<T> => {
  if ("operator" in query && "args" in query) {
    return compiler.compile(query)
  }

  return compiler.compile({
    operator: "and",
    args: Object.keys(query).map(field => ({
      operator: "eq", args: [field, query[field]]
    }))
  })
}
