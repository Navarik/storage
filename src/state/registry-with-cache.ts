import LRU from "lru-cache"
import { CanonicalEntity, UUID, EntityRegistry } from "../types"

interface Config<M extends object> {
  cacheSize: number
  registry: EntityRegistry<M>
}

export class RegistryWithCache<M extends object> implements EntityRegistry<M> {
  private cacheSize: number
  private cache: LRU<string, CanonicalEntity<any, M>>
  private registry: EntityRegistry<M>

  constructor({ cacheSize, registry }: Config<M>) {
    this.cacheSize = cacheSize
    this.registry = registry
    this.cache = new LRU({
      max: cacheSize
    })
  }

  async put<B extends object>(entity: CanonicalEntity<B, M>) {
    await this.registry.put(entity)

    if (this.cache.has(entity.id)) {
      this.cache.set(entity.id, entity)
    }
  }

  async has(id: UUID) {
    if (this.cache.has(id)) {
      return true
    }

    return this.registry.has(id)
  }

  async history<B extends object>(id: string) {
    return this.registry.history<B>(id)
  }

  async get<B extends object>(id: UUID) {
    if (this.cache.has(id)) {
      return this.cache.get(id)
    }

    const entity = await this.registry.get<B>(id)
    if (entity) {
      this.cache.set(id, entity)
    }

    return entity
  }

  async delete<B extends object>(document: CanonicalEntity<B, M>) {
    await this.registry.delete(document)
    this.cache.delete(document.id)
  }

  async isClean() {
    return this.registry.isClean()
  }

  async up() {
    await this.registry.up()
  }

  async down() {
    await this.registry.down()
  }

  async isHealthy() {
    return this.registry.isHealthy()
  }

  async stats() {
    return {
      size: this.cacheSize,
      used: this.cache.size
    }
  }
}
