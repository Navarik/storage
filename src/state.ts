import LRU from "lru-cache"
import { CanonicalEntity, SearchIndex, UUID } from "./types"

interface StateConfig<M extends object> {
  cacheSize: number
  searchIndex: SearchIndex<M>
}

export class State<M extends object> {
  private cacheSize: number
  private cache: LRU<string, CanonicalEntity<any, M>>
  private searchIndex: SearchIndex<M>

  constructor({ cacheSize, searchIndex }: StateConfig<M>) {
    this.cacheSize = cacheSize
    this.searchIndex = searchIndex
    this.cache = new LRU({
      max: cacheSize,
      length: (document) => JSON.stringify(document).length
    })
  }

  async put<B extends object>(document: CanonicalEntity<B, M>) {
    this.cache.set(document.id, document)
  }

  async has(id: UUID) {
    const cached = this.cache.has(id)
    if (cached) {
      return true
    }

    const count = await this.searchIndex.count({ id })
    const exists = count > 0

    return exists
  }

  async get<B extends object>(id: UUID) {
    const cachedDocument = this.cache.get(id)
    if (cachedDocument) {
      return cachedDocument
    }

    const [foundDocument] = await this.searchIndex.find<B>({ id }, {})
    if (foundDocument) {
      this.put(foundDocument)
    }

    return foundDocument
  }

  async delete(id: UUID) {
    this.cache.del(id)
  }

  async up() {}
  async down() {}
  async isHealthy() {
    return true
  }

  async stats() {
    return {
      cacheSize: this.cacheSize,
      cacheUsed: this.cache.length
    }
  }
}
