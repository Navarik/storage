import { SearchQuery, QueryLinker } from "../../types"

export class PassthroughLinker implements QueryLinker {
  link(query: SearchQuery) {
    return query
  }
}
