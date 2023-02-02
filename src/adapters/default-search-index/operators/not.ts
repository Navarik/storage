import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"

export class NotOperator implements FilterCompiler {
  private root: FilterCompiler

  constructor(root: FilterCompiler) {
    this.root = root
  }

  compile(query: SearchQuery) {
    const arg = this.root.compile(query.args[0])

    return (data: object) => !arg(data)
  }
}

