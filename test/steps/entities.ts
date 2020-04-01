import expect from 'expect.js'
import { TypedEntity, Storage, SearchQuery, IdentifiedEntity, CanonicalEntity } from '../../src'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  async cannotCreate(entity: TypedEntity) {
    try {
      await this.storage.create(entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canCreate(entity: TypedEntity) {
    let response

    // Create entity
    response = await this.storage.create(entity)
    expectSameEntity(response, entity)

    // Try to read it back by ID
    const id = response.id
    response = await this.storage.get(id)
    expectSameEntity(response, entity)

    return response
  }

  async canCreateCollection(collection: Array<TypedEntity>) {
    let response

    // Create entity
    response = await this.storage.createBulk(collection)
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

  async canFind(entity: CanonicalEntity) {
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

    response = await this.storage.find(query)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)
  }

  async cannotUpdate(entity: IdentifiedEntity) {
    try {
      await this.storage.update(entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canUpdate(entity: IdentifiedEntity) {
    const response = await this.storage.update(entity)
    expectSameEntity(response, entity)
  }
}
