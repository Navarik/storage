import expect from 'expect.js'
import { nullLogger } from "./fixtures/null-logger"
import { Storage } from '../src'

const storage = new Storage({ logger: nullLogger })

describe('Empty state', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("has no types", async () => {
    const response = storage.types()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("has no entities", async () => {
    const response = await storage.find('doge')
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })
})
