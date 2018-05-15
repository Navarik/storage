import expect from 'expect.js'
import createStorage from '../src'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

describe("Initial state", () => {
  before(() => storage.init())

  it("should have no namespaces", async () => {
    const response = await storage.schema.getNamespaces()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no types", async () => {
    const response = await storage.schema.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no entities", async () => {
    const response = await storage.entity.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
