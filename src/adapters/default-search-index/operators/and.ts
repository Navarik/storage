import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"

export class AndOperator implements FilterCompiler {
  private root: FilterCompiler

  constructor(root: FilterCompiler) {
    this.root = root
  }

  compile(query: SearchQuery) {
    const args = query.args.map(x => this.root.compile(x))

    return (data: object) => {
      for (const arg of args) {
        if (!arg(data)) {
          return false
        }
      }

      return true
    }
  }
}

