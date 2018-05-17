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
    const response = await storage.entity.create(type, payload)
    expectEntity(response)
    expect(response.type).to.eql(type)
    expect(response.version).to.eql(1)
    expect(response.payload).to.eql(payload)
  })
})

export default createSteps
