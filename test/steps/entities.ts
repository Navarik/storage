import { Dictionary } from "@navarik/types"
import { expect } from "chai"
import { EntityPatch, StorageInterface, CanonicalEntity, UUID, EntityData } from '../../src'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: StorageInterface<any>

  constructor(storage: StorageInterface<any>) {
    this.storage = storage
  }

  async cannotCreate(entity: EntityData<any, any>, user?: UUID) {
    try {
      await this.storage.create(entity, user)
    } catch (err) {
      expect(true).to.equal(true)
      return
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async canCreate(entity: EntityData<any, any>, user?: UUID) {
    // Create entity
    const created = await this.storage.create(entity, user)
    expectSameEntity(created, entity)

    // Try to read it back by ID
    const id = created.id
    const found = await this.storage.get(id)
    expectSameEntity(found, entity)

    return created
  }

  async canDelete(id: string) {
    const lastVersion = await this.storage.get(id)
    const response = await this.storage.delete(id)
    expectSameEntity(response, lastVersion)

    return response
  }

  async canFind(entity: Partial<CanonicalEntity<any, any>>, user?: UUID) {
    let response

    // Find using fields in a query
    const query: Dictionary<any> = {}
    if (entity.id) query.id = entity.id
    if (entity.type) query.type = entity.type
    if (entity.body) {
      for (const field in entity.body) {
        query[`body.${field}`] = entity.body[field]
      }
    }
    if (entity.meta) {
      for (const field in entity.meta) {
        query[`meta.${field}`] = String(entity.meta[field])
      }
    }

    response = await this.storage.find(query, {}, user)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)

    return response[0]
  }

  async cannotGet(id: string, user?: UUID) {
    try {
      await this.storage.get(id, {}, user)
    } catch (err) {
      expect(true).to.equal(true)
      return
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async cannotDelete(id: string, user?: UUID) {
    try {
      await this.storage.delete(id, user)
    } catch (err) {
      expect(true).to.equal(true)
      return
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async cannotFind(entity: Partial<CanonicalEntity<any, any>>, user?: UUID) {
    let response

    // Find using fields in a query
    const query: Dictionary<any> = {}
    if (entity.id) query.id = entity.id
    if (entity.type) query.type = entity.type
    if (entity.body) {
      for (const field in entity.body) {
        query[`body.${field}`] = String(entity.body[field])
      }
    }
    if (entity.meta) {
      for (const field in entity.meta) {
        query[`meta.${field}`] = String(entity.meta[field])
      }
    }

    response = await this.storage.find(query, {}, user)
    expect(response).to.be.an('array')
    expect(response).to.have.length(0)
  }

  async cannotUpdate(entity: EntityPatch<any, any>) {
    try {
      await this.storage.update(entity)
    } catch (err) {
      expect(true).to.equal(true)
      return
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async canUpdate(entity: EntityPatch<any, any>) {
    const response = await this.storage.update(entity)
    expectSameEntity(response, entity)
    return response
  }
}
