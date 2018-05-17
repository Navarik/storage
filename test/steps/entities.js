import expect from 'expect.js'
import curry from 'curry'

import { expectEntity } from './checks'

const createSteps = storage => ({
  cannotCreate: curry((type, payload) => (done) => {
    storage.entity.create(type, payload)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  }),

  canCreate: curry((type, payload) => async () => {
    let response

    // Create entity
    response = await storage.entity.create(type, payload)
    expectEntity(response)
    expect(response.type).to.eql(type)
    expect(response.version).to.eql(1)
    expect(response.payload).to.eql(payload)

    // Try to read it back by ID
    const id = response.id
    response = await storage.entity.get(id)
    expectEntity(response)
    expect(response.type).to.eql(type)
    expect(response.version).to.eql(1)
    expect(response.payload).to.eql(payload)
  })
})

export default createSteps
