import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, ActionType, CanonicalSchema } from '../../types'
import { ObjectFilter } from "./object-filter"
import { objectCompare } from "./object-compare"
import { SubqueryOperator } from "./subquery"

export class DefaultSearchIndex<M extends object> implements SearchIndex<M> {
  public documents: Array<CanonicalEntity<any, M>> = []
  private filterCompiler: ObjectFilter = new ObjectFilter()

  private parseSort(sortQueries: Array<string>): Array<{ field: string, direction: "desc"|"asc" }> {
    const result: Array<{ field: string, direction: "desc"|"asc" }> = []
    for (const item of sortQueries) {
      const [field, direction = ""] = item.split(':')
      result.push({
        field: field.trim(),
        direction: direction.trim().toLowerCase() === "desc" ? "desc" : "asc"
      })
    }

    return result
  }

  async update<B extends object>(action: ActionType, document: CanonicalEntity<B, M>, schema: CanonicalSchema): Promise<void> {
    if (action === "create") {
      this.documents.push(document)
    } else if (action === "update")  {
      this.documents = this.documents.map(x => x.id === document.id ? document : x)
    } else if (action === "delete")  {
      this.documents = this.documents.filter(x => x.id !== document.id)
    } else {
      throw new Error(`Unknown action: ${action}`)
    }
  }

  async find<B extends object>(searchParams: SearchQuery, { offset = 0, limit = 0, sort = [] }: SearchOptions = {}): Promise<Array<CanonicalEntity<B, M>>> {
    const filter = this.filterCompiler.compile(searchParams)
    const comparator = objectCompare(this.parseSort(sort instanceof Array ? sort : sort.split(",")))

    const collection = this.documents.filter(filter).sort(comparator)

    return limit ? collection.slice(offset, offset + limit) : collection.slice(offset)
  }

  async count(searchParams: SearchQuery): Promise<number> {
    const filter = this.filterCompiler.compile(searchParams)

    let count = 0
    this.documents.forEach(x => {
      if (filter(x)) {
        count++
      }
    })

    return count
  }

  async up() {
    this.documents = []
    this.filterCompiler.addOperator("subquery", new SubqueryOperator(this.filterCompiler, this.documents))
  }

  async down() {
    this.documents = []
  }

  async isHealthy() {
    return true
  }

  async isClean() {
    return false
  }
}
