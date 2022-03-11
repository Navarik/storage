import { Dictionary } from "@navarik/types"
import { SearchQuery, QueryCompiler } from "../../types"

export class NestedCompiler implements QueryCompiler<SearchQuery> {
  private rootCompiler: QueryCompiler<SearchQuery|Dictionary<string>>

  constructor({ rootCompiler }) {
    this.rootCompiler = rootCompiler
  }

  compile(query: SearchQuery) {
    return {
      operator: query.operator,
      args: query.args.filter(x => x !== undefined).map(x => this.rootCompiler.compile(x))
    }
  }
}
