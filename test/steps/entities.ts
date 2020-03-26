import expect from 'expect.js'
import { TypedEntity, Storage, SearchQuery, IdentifiedEntity, CanonicalEntity, UUID } from '../../src'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  async cannotCreate(user: UUID, entity: TypedEntity) {
    try {
      await this.storage.create(user, entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canCreate(user: UUID, entity: TypedEntity) {
    let response

    // Create entity
    response = await this.storage.create(user, entity)
    expectSameEntity(response, entity)

    // Try to read it back by ID
    const id = response.id
    response = await this.storage.get(user, id)
    expectSameEntity(response, entity)

    return response
  }

  async canCreateCollection(user: UUID, collection: Array<TypedEntity>) {
    let response

    // Create entity
    response = await this.storage.createBulk(user, collection)
    expect(response).to.be.an('array')
    expect(response).to.have.length(collection.length)

    response.forEach((entity, index) => {
      expectSameEntity(entity, collection[index])
    })

    // Try to read it back by ID
    response = await Promise.all(response.map(x => this.storage.get(user, x.id)))
    expect(response).to.be.an('array')
    expect(response).to.have.length(collection.length)

    response.forEach((entity, index) => {
      expectSameEntity(entity, collection[index])
    })
  }

  async canFind(user: UUID, entity: CanonicalEntity) {
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

    response = await this.storage.find(user, query)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)
  }

  async cannotUpdate(user: UUID, entity: IdentifiedEntity) {
    try {
      await this.storage.update(user, entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canUpdate(user: UUID, entity: IdentifiedEntity) {
    const response = await this.storage.update(user, entity)
    expectSameEntity(response, entity)
  }
}
