import LRU from "lru-cache"
import { CanonicalEntity, SearchIndex, UUID, EntityRegistry } from "../types"

interface Config<M extends object> {
  cacheSize: number
  searchIndex: SearchIndex<M>
}

export class CachedSearchEntityRegistry<M extends object> implements EntityRegistry<M> {
  private cacheSize: number
  private cache: LRU<string, CanonicalEntity<any, M>>
  private searchIndex: SearchIndex<M>

  constructor({ cacheSize, searchIndex }: Config<M>) {
    this.cacheSize = cacheSize
    this.searchIndex = searchIndex
    this.cache = new LRU({
      max: cacheSize,
      maxSize: cacheSize,
      sizeCalculation: (document) => JSON.stringify(document).length
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

    const count = await this.searchIndex.count(
      { operator: "eq", args: ["id", id] }
    )
    const exists = count > 0

    return exists
  }

  async get<B extends object>(id: UUID) {
    const cachedDocument = this.cache.get(id)
    if (cachedDocument) {
      return cachedDocument
    }

    const [foundDocument] = await this.searchIndex.find<B>(
      { operator: "eq", args: ["id", id] },
      { limit: 1 }
    )
    if (foundDocument) {
      this.put(foundDocument)
    }

    return foundDocument
  }

  async delete(id: UUID) {
    this.cache.delete(id)
  }

  async up() {}
  async down() {}
  async isHealthy() {
    return true
  }

  async stats() {
    return {
      cacheSize: this.cacheSize,
      cacheUsed: this.cache.size
    }
  }
}
