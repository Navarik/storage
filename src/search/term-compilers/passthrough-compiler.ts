import { SearchQuery, QueryCompiler } from "../../types"

export class PassthroughCompiler implements QueryCompiler<SearchQuery> {
  compile(query: SearchQuery) {
    return query
  }
}
