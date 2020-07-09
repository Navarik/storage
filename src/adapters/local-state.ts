import LRU from "lru-cache"
import { State, CanonicalEntity, SearchIndex, UUID } from "../types"

interface LocalStateConfig<B extends object, M extends object> {
  size: number
  searchIndex: SearchIndex<B, M>
}

export class LocalState<B extends object, M extends object> implements State<B, M> {
  private maxSize: number
  private cache: LRU<string, CanonicalEntity<B, M>>
  private searchIndex: SearchIndex<B, M>

  constructor({ size, searchIndex }: LocalStateConfig<B, M>) {
    this.maxSize = size
    this.searchIndex = searchIndex
    this.cache = new LRU({
      max: size,
      length: (document) => JSON.stringify(document).length
    })
  }

  async put(document: CanonicalEntity<B, M>) {
    this.cache.set(document.id, document)
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

  get cacheSize() {
    return Promise.resolve(this.maxSize)
  }

  get cacheUsed() {
    return Promise.resolve(this.cache.length)
  }
}
