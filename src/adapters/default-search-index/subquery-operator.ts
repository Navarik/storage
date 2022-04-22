import objectPath from "object-path"
import { CanonicalEntity, SearchQuery } from "../../types"

interface FilterCompiler {
  compile(query: SearchQuery): (data: any) => boolean
}

export class SubqueryOperator implements FilterCompiler {
  private root: FilterCompiler
  private index: Array<CanonicalEntity<any, any>>

  constructor(rootCompiler, index) {
    this.root = rootCompiler
    this.index = index
  }

  compile(query: SearchQuery) {
    const [field, value] = query.args
    const subquery = this.root.compile(value)

    return (data: object) => {
      const ids = this.index.filter(subquery).map(x => x.id)
      const given = objectPath.get(data, field)

      return ids.includes(given)
    }
  }
}

