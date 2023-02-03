import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"

export class FulltextOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [expected] = query.args

    return (data: object) => JSON.stringify(data).includes(expected)
  }
}
