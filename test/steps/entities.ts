import { expect } from "chai"
import { PartialEntity, Storage, SearchQuery, CanonicalEntity, UUID } from '../../src'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: Storage<any, any>

  constructor(storage: Storage<any, any>) {
    this.storage = storage
  }

  async cannotCreate(entity: PartialEntity<any, any>) {
    try {
      await this.storage.update(entity)
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canCreate(entity: PartialEntity<any, any>) {
    // Create entity
    const created = await this.storage.update(entity)
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

  async canCreateCollection(collection: Array<PartialEntity<any, any>>) {
    let response

    // Create entity
    response = await this.storage.updateBulk(collection)
    expect(response).to.be.an('array')
    expect(response).to.have.length(collection.length)

    response.forEach((entity, index) => {
      expectSameEntity(entity, collection[index])
    })

    // Try to read it back by ID
    response = await Promise.all(response.map(x => this.storage.get(x.id)))
    expect(response).to.be.an('array')
    expect(response).to.have.length(collection.length)

    response.forEach((entity, index) => {
      expectSameEntity(entity, collection[index])
    })
  }

  async canFind(entity: Partial<CanonicalEntity<any, any>>, user: UUID|undefined = undefined) {
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

  async cannotFind(entity: Partial<CanonicalEntity<any, any>>, user: UUID|undefined = undefined) {
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

  async cannotUpdate(entity: PartialEntity<any, any>) {
    try {
      await this.storage.update(entity)
      expect(true).to.equal(false, "Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canUpdate(entity: PartialEntity<any, any>) {
    const response = await this.storage.update(entity)
    expectSameEntity(response, entity)
  }
}
