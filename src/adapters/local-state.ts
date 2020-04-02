import LRU from "lru-cache"
import { State, CanonicalEntity, SearchIndex, UUID } from "../types"

interface LocalStateConfig {
  size: number
  searchIndex: SearchIndex<CanonicalEntity>
}

export class LocalState implements State<CanonicalEntity> {
  private cache: LRU<string, CanonicalEntity>
  private searchIndex: SearchIndex<CanonicalEntity>

  constructor({ size, searchIndex }: LocalStateConfig) {
    this.searchIndex = searchIndex
    this.cache = new LRU({
      max: size,
      length: (document) => JSON.stringify(document).length
    })
  }

  async put(document: CanonicalEntity) {
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
}
