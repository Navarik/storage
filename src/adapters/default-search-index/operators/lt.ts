import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"
import objectPath from "object-path"
import { normalizeType } from "../normalize-type"

export class LtOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [field, expected] = query.args

    return (data: object) =>
      normalizeType(objectPath.get(data, field)) < normalizeType(expected)
  }
}
