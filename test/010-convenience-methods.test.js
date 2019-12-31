import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'
import * as fixtureSchemata from './fixtures/schemata/schemata.json'

const storage = createStorage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs
  }
})

const fixtureSchemataNames = fixtureSchemata.map(x => x.name)

describe('Convenience methods', () => {
  before(() => storage.init())

  it("can name all the schemas", async () => {
    const response = await storage.types()
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixtureSchemataNames.length)
    response.forEach(name =>
      expect(fixtureSchemataNames.includes(name)).to.be(true)
    )
  })

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
