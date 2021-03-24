import { expect } from "chai"
import { EntityPatch, Storage, SearchQuery, CanonicalEntity, UUID, EntityData } from '../../src'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: Storage<any>

  constructor(storage: Storage<any>) {
    this.storage = storage
  }

  async cannotCreate(entity: EntityData<any, any>, user?: UUID) {
    try {
      await this.storage.create(entity, "AAA", user)
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canCreate(entity: EntityData<any, any>, user?: UUID) {
    // Create entity
    const created = await this.storage.create(entity, "AAAA", user)
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
    const query: SearchQuery = {}
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
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)
  }

  async cannotGet(id: string, user?: UUID) {
    try {
      await this.storage.get(id, user)
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async cannotDelete(id: string, user?: UUID) {
    try {
      await this.storage.delete(id, "Ohno!", user)
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async cannotFind(entity: Partial<CanonicalEntity<any, any>>, user?: UUID) {
    let response

    // Find using fields in a query
    const query: SearchQuery = {}
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
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canUpdate(entity: EntityPatch<any, any>) {
    const response = await this.storage.update(entity)
    expectSameEntity(response, entity)
    return response
  }
}
