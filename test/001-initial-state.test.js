import expect from 'expect.js'
import createStorage from '../src'

const storage = createStorage()

describe("Initial state", () => {
  before(() => storage.init())

  it("should have no namespaces", async () => {
    const response = await storage.getNamespaces()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

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
