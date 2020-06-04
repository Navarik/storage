import { expect } from "chai"
import { Storage, CanonicalSchema, CanonicalEntity, ChangeEvent } from '../src'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('./fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('./fixtures/data/job-orders.json')

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

describe('Observing changes', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can observe entity changes", async () => {
    const results: Array<ChangeEvent<any, any>> = []
    storage.observe((x) => { results.push(x) })

    for (const entity of fixturesJobs) {
      await storage.update(entity)
    }

    expect(results).to.be.an('array')
    expect(results).to.have.length(fixturesJobs.length)

    for (const entity of fixturesEvents) {
      await storage.update(entity)
    }

    expect(results).to.be.an('array')
    expect(results).to.have.length(fixturesJobs.length + fixturesEvents.length)
  })
})
