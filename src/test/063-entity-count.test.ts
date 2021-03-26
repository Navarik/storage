import { expect } from "chai"
import { Storage, CanonicalSchema, CanonicalEntity } from '..'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('./fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('./fixtures/data/job-orders.json')

const storage = new Storage({
  schema: fixtureSchemata,
  data: [ ...fixturesEvents, ...fixturesJobs ],
  logger: nullLogger
})

describe('Entity counts', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can count entities", async () => {
    const response = await storage.count()
    expect(response).to.equal(fixturesEvents.length + fixturesJobs.length)
  })

  it("can count entities with filters", async () => {
    const response1 = await storage.count({ type: 'timelog.timelog_event' })
    expect(response1).to.equal(fixturesEvents.length)

    const response2 = await storage.count({ type: 'document.job_order' })
    expect(response2).to.equal(fixturesJobs.length)
  })
})
