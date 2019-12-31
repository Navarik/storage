import * as expect from 'expect.js'
import * as createStorage from '../src'

const storage = createStorage()

describe('Empty state', () => {
  before(() => storage.init())

  it("should have no types", async () => {
    const response = await storage.findSchema()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no entities", async () => {
    const response = await storage.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
