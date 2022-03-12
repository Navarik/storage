import { CanonicalEntity, SearchIndex, UUID, EntityRegistry } from "../types"

interface Config<M extends object> {
  searchIndex: SearchIndex<M>
}

export class SearchBasedEntityRegistry<M extends object> implements EntityRegistry<M> {
  private searchIndex: SearchIndex<M>

  constructor({ searchIndex }: Config<M>) {
    this.searchIndex = searchIndex
  }

  async put<B extends object>(document: CanonicalEntity<B, M>) {
    // This registry lives on top of the search index, it knows nothing
  }

  async has(id: UUID) {
    const count = await this.searchIndex.count(
      { operator: "eq", args: ["id", id] }
    )

    return count > 0
  }

  async get<B extends object>(id: UUID) {
    const [entity] = await this.searchIndex.find<B>(
      { operator: "eq", args: ["id", id] },
      { limit: 1 }
    )

    return entity
  }

  async delete(id: UUID) {
    // This registry lives on top of the search index, it knows nothing
  }

  async isClean() {
    return true
  }

  async up() {}
  async down() {}
  async isHealthy() {
    return true
  }

  async stats() {
    return {}
  }
}
