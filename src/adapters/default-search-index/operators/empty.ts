import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"
import objectPath from "object-path"

export class EmptyOperator implements FilterCompiler {
  compile(query: SearchQuery) {
    const [field] = query.args

    return (data: object) => {
      const value = objectPath.get(data, field)
      return value === null || value === undefined || value === ""
    }
  }
}
