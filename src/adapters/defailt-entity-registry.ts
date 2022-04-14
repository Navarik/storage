import { Dictionary } from "@navarik/types"
import { CanonicalEntity, UUID, EntityRegistry } from "../types"

export class DefaultEntityRegistry<M extends object> implements EntityRegistry<M> {
  private live: Dictionary<Array<CanonicalEntity<any, M>>> = {}
  private dead: Dictionary<Array<CanonicalEntity<any, M>>> = {}

  async put<B extends object>(document: CanonicalEntity<B, M>) {
    if (!this.live[document.id]) {
      this.live[document.id] = []
    }

    this.live[document.id]?.unshift({ ...document })
  }

  async has(id: UUID) {
    return !!this.live[id]
  }

  async history(id: UUID) {
    const versions = this.live[id] || this.dead[id]
    if (!versions) {
      return []
    }

    return versions
  }

  async get(id: UUID) {
    const versions = this.live[id]
    if (!versions) {
      return undefined
    }

    return versions[0]
  }

  async delete<B extends object>(document: CanonicalEntity<B, M>) {
    if (!this.live[document.id]) {
      return
    }

    this.dead[document.id] = this.live[document.id]
    delete this.live[document.id]
    this.dead[document.id]?.unshift({ ...document })
  }

  async isClean() {
    return false
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
