import * as expect from 'expect.js'
import { Storage } from '../src'
import * as fixtureSchemata from './fixtures/schemata'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'

const storage = new Storage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs
  }
})

const fixtureSchemataNames = fixtureSchemata.map(x => x.name)

describe('Entity counts', () => {
  before(() => storage.init())

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
