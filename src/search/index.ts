import { SearchIndex, CanonicalEntity, SearchOptions, SearchQuery, CanonicalSchema } from "../types"

export class Search<MetaType extends object> {
  private searchIndex: SearchIndex<MetaType>

  constructor({ index }) {
    this.searchIndex = index
  }

  registerSchema(schema: CanonicalSchema) {
  }

  async find<BodyType extends object>(query: SearchQuery|{}, options: SearchOptions = {}): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const collection = await this.searchIndex.find<BodyType>(query, options)

    return collection
  }

  async count(query: SearchQuery|{}): Promise<number> {
    const count = this.searchIndex.count(query)

    return count
  }
}
