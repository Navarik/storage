import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: {
      'timelog.timelog_event': fixturesEvents,
      'document.job_order': fixturesJobs
    },
    ...config,
  })

  const fixtureSchemataNames = fixtureSchemata.map(x => x.name)

  describe(`Convenience methods, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())

    it("can name all the schemas", async () => {
      const response = await storage.schemaNames()
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
}

generateConfig().forEach(c => run(c))
