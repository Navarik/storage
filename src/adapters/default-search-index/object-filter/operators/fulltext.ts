import { FilterCompiler, SearchQuery } from "../types"

export class FulltextOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [expected] = query.args

    return (data: object) => JSON.stringify(data).includes(expected)
  }
}
