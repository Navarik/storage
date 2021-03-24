import LRU from "lru-cache"
import { State, CanonicalEntity, SearchIndex, UUID } from "../types"

interface LocalStateConfig<M extends object> {
  size: number
  searchIndex: SearchIndex<M>
}

export class LocalState<M extends object> implements State<M> {
  private maxSize: number
  private cache: LRU<string, CanonicalEntity<any, M>>
  private searchIndex: SearchIndex<M>

  constructor({ size, searchIndex }: LocalStateConfig<M>) {
    this.maxSize = size
    this.searchIndex = searchIndex
    this.cache = new LRU({
      max: size,
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

  async get(id: UUID) {
    const cachedDocument = this.cache.get(id)
    if (cachedDocument) {
      return cachedDocument
    }

    const [foundDocument] = await this.searchIndex.find({ id }, {})
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
      cacheSize: this.maxSize,
      cacheUsed: this.cache.length
    }
  }
}
