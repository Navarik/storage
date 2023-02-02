import { SearchQuery } from "../../../types"
import { FilterCompiler } from "../types"
import objectPath from "object-path"

export class InOperator implements FilterCompiler {
  private root: FilterCompiler

  constructor(root: FilterCompiler) {
    this.root = root
  }

  compile(query: SearchQuery) {
    const [field, options] = query.args

    const check = typeof options === "object" && !(options instanceof Array)
      ? this.root.compile(options)
      : (data: object) => options.includes(objectPath.get(data, field))

    return check
  }
}
