import { SearchQuery, QueryLinker } from "../../types"

export class NestedLinker implements QueryLinker {
  private rootLinker: QueryLinker

  constructor({ rootLinker }) {
    this.rootLinker = rootLinker
  }

  link(query: SearchQuery) {
    return {
      operator: query.operator,
      args: query.args.map(x => this.rootLinker.link(x))
    }
  }
}
