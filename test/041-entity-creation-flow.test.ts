import expect from 'expect.js'
import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { nullLogger } from "./fixtures/null-logger"
import { EntitySteps } from './steps/entities'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity> = require('./fixtures/data/events')

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

const steps = new EntitySteps(storage)

describe('Entity creation flow', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("doesn't have entities before they are created", async () => {
    const response = await storage.find('doge')
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("correctly creates new entities", async () => {
    await Promise.all(fixturesEvents.map(x => steps.canCreate('doge', x)))
  })

  it("can find created entities", async () => {
    await Promise.all(fixturesEvents.map(x => steps.canFind('doge', x)))
  })

  it("allows duplicates", async () => {
    await Promise.all(fixturesEvents.map(x => steps.canCreate('doge', x)))
  })

  it("correct number of entities is created", async () => {
    const response = await storage.find('doge')
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixturesEvents.length * 2)
  })
})
