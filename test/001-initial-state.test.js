import expect from 'expect.js'
import createStorage from '../src'

const storage = createStorage({
  queue: 'default',
  searchIndex: 'default',
  schemaSource: '',
  dataSource: ''
})

describe("Initial state", () => {
  before(() => storage.connect())

  it("should have no namespaces", async function () {
    const response = await schema.getNamespaces()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no types", async function () {
    const response = await storage.schema.findLatest({})
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no type history", async function () {
    const response = await storage.schema.findVersions({})
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no entities", async function () {
    const response = await storage.entity.findLatest({})
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no entity history", async function () {
    const response = await storage.entity.findVersions({})
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
