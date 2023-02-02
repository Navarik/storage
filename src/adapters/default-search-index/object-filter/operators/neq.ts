import { FilterCompiler, SearchQuery } from "../types"
import objectPath from "object-path"
import { normalizeType } from "../normalize-type"

export class NeqOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [field, expected] = query.args

    return (data: object) =>
      normalizeType(objectPath.get(data, field)) !== normalizeType(expected)
  }
}
