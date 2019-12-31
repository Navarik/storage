import * as expect from 'expect.js'
import { Storage } from '../src'
import * as fixtureSchemata from './fixtures/schemata'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'

const storage = new Storage({
  schema: fixtureSchemata
})

describe('Observing changes', () => {
  before(() => storage.init())

  it("can observe entity changes", async () => {
    const results = []
    storage.observe((x) => { results.push(x) })

    for (const entity of fixturesJobs) {
      await storage.create('document.job_order', entity)
    }

    expect(results).to.be.an('array')
    expect(results).to.have.length(fixturesJobs.length)

    for (const entity of fixturesEvents) {
      await storage.create('timelog.timelog_event', entity)
    }

    expect(results).to.be.an('array')
    expect(results).to.have.length(fixturesJobs.length + fixturesEvents.length)
  })

  it("can filter changes to observe", async () => {
    const jobs = []
    const events = []
    storage.observe((x) => { jobs.push(x) }, { type: 'document.job_order' })
    storage.observe((x) => { events.push(x) }, { type: 'timelog.timelog_event' })

    for (const entity of fixturesJobs) {
      await storage.create('document.job_order', entity)
    }

    for (const entity of fixturesEvents) {
      await storage.create('timelog.timelog_event', entity)
    }

    expect(jobs).to.be.an('array')
    expect(jobs).to.have.length(fixturesJobs.length)
    expect(events).to.be.an('array')
    expect(events).to.have.length(fixturesEvents.length)
  })
})
