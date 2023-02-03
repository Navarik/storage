import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"

export class NoopOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    return () => true
  }
}

