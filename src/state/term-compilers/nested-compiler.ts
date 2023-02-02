import { Dictionary, SearchQuery, QueryCompiler } from "../../types"

export class NestedCompiler implements QueryCompiler<SearchQuery> {
  private rootCompiler: QueryCompiler<SearchQuery|Dictionary<string>>

  constructor({ rootCompiler }: { rootCompiler: QueryCompiler<SearchQuery> }) {
    this.rootCompiler = rootCompiler
  }

  compile(query: SearchQuery) {
    return {
      operator: query.operator,
      args: query.args.filter(x => x !== undefined).map(x => this.rootCompiler.compile(x))
    }
  }
}
