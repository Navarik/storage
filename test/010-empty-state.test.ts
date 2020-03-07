import expect from 'expect.js'
import { Storage } from '../src'

const storage = new Storage()

describe('Empty state', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("has no types", async () => {
    const response = storage.types()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("has no entities", async () => {
    const response = await storage.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
