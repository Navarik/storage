import expect from 'expect.js'
import { TypedEntity } from '../../src/types'
import { expectSameEntity } from './checks'

export class EntitySteps {
  private storage: Storage

  constructor(storage) {
    this.storage = storage
  }

  async cannotCreate(entity) {
    try {
      await this.storage.create(entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canCreate(entity) {
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

  async canFind(entity) {
    let response

    // Find using fields in a query
    response = await this.storage.find(entity)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)
  }

  async cannotUpdate(entity) {
    try {
      await this.storage.update(entity)
      expect().fail("Expected error didn't happen")
    } catch (err) {
      expect(true).to.equal(true)
    }
  }

  async canUpdate(entity) {
    const response = await this.storage.update(entity)
    expectSameEntity(response, entity)
  }
}
