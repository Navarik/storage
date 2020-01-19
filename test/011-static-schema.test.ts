import expect from 'expect.js'
import { Storage } from '../src'

const fixtureSchemata = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata
})

describe('Static schema, no data', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("should have defined types", async () => {
    const response = storage.types()
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixtureSchemata.length)
    fixtureSchemata.forEach(schema => {
      expect(response).to.contain(schema.type)
      expect(storage.describe(schema.type)).to.equal(schema)
    })
  })

  it("should have no entities", async () => {
    const response = await storage.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
