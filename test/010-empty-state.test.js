import * as expect from 'expect.js'
import { Storage } from '../src'

const storage = new Storage({ schema: [] })

describe('Empty state', () => {
  before(() => storage.init())

  it("should have no types", async () => {
    const response = storage.types()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("should have no entities", async () => {
    const response = await storage.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
