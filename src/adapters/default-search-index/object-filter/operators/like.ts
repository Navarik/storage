import { FilterCompiler, SearchQuery } from "../types"
import objectPath from "object-path"

export class LikeOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [field, regex, options] = query.args
    const regexp = new RegExp(regex, options)

    return (data: object) => objectPath.has(data, field)
        && regexp.test(objectPath.get(data, field))
  }
}
