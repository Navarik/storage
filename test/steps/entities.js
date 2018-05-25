import expect from 'expect.js'
import curry from 'curry'

import { expectEntity } from './checks'

const createSteps = storage => ({
  cannotCreate: curry((type, body) => (done) => {
    storage.create(type, body)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  }),

  canCreate: curry((type, body) => async () => {
    let response

    // Create entity
    response = await storage.create(type, body)
    expectEntity(response)
    expect(response.type).to.eql(type)
    expect(response.version).to.eql(1)
    expect(response.body).to.eql(body)

    // Try to read it back by ID
    const id = response.id
    response = await storage.get(id)
    expectEntity(response)
    expect(response.type).to.eql(type)
    expect(response.version).to.eql(1)
    expect(response.body).to.eql(body)
  }),

  cannotUpdate: (id, body) => done => {
    storage.update(id, body)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canUpdate: (id, body) => async () => {
    const previous = await storage.get(id)
    expectEntity(previous)

    const response = await storage.update(id, body)
    expectEntity(response)
    expect(response.body).to.eql(body)
    expect(response.version).to.be(previous.version + 1)
  }
})

export default createSteps
