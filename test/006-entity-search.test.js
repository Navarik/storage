import expect from 'expect.js'
import createStorage, { findSubstring, findPrefix, findSuffix } from '../src'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import fixturesEvents from './fixtures/data/events.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixturesUsers from './fixtures/data/users.json'
import fixturesMessages from './fixtures/data/messages.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    ...config,
  })

  const { canCreate, cannotCreate, canFind } = createSteps(storage)

  describe(`Entity search, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())
    after(() => {
      if (config.index.cleanup) {
        return config.index.cleanup()
      }
    })

    it("correctly creates new entities: timelog events", forAll(fixturesEvents, canCreate('timelog.timelog_event')))
    it("correctly creates new entities: job orders", forAll(fixturesJobs, canCreate('document.job_order')))
    it("correctly creates new entities: users", forAll(fixturesUsers, canCreate('profile.user')))
    it("correctly creates new entities: messages", forAll(fixturesMessages, canCreate('chat.text_message')))

    it("can find by complete bodies: timelog events", forAll(fixturesEvents, canFind))
    it("can find by complete bodies: job orders", forAll(fixturesJobs, canFind))
    it("can find by complete bodies: users", forAll(fixturesUsers, canFind))
    it("can find by complete bodies: messages", forAll(fixturesMessages, canFind))

    it("can find entities by type", async () => {
      const response = await storage.find({ type: 'timelog.timelog_event' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.version).to.equal(1)
        expect(entity.type).to.equal('timelog.timelog_event')
      })
    })

    it("can find entities by one field", async () => {
      const response = await storage.find({ sender: '1' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(6)
      response.forEach(expectEntity)
    })

    it("can find entities by combination of fields", async () => {
      let response = await storage.find({ sender: '1', job_order: '13' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
      response.forEach(expectEntity)

      response = await storage.find({ sender: 1, job_order: 13 })
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
      response.forEach(expectEntity)
    })

    it("can find entities by type and combination of fields", async () => {
      let response = await storage.find({ sender: '1', job_order: '13', type: 'timelog.timelog_event' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.version).to.equal(1)
        expect(entity.type).to.equal('timelog.timelog_event')
      })

      response = await storage.find({ sender: 1, job_order: 13, type: 'timelog.timelog_event' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
    })

    it("can find entities by piece of content of one or many fields", async () => {
      let response = await storage.findContent('immediate acceptance')
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
      response.forEach(expectEntity)

      response = await storage.findContent('load')
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
      response.forEach(expectEntity)
    })

    it("can find entities by case-insensitive substring", async () => {
      const response = await storage.find({ text: findSubstring('search term') })
      expect(response).to.be.an('array')
      expect(response).to.have.length(3)
      response.forEach(expectEntity)
    })

    it("properly escapes regex chaf in substrings", async () => {
      const response = await storage.find({ text: findSubstring('search.term') })
      expect(response).to.be.an('array')
      expect(response).to.have.length(1)
      response.forEach(expectEntity)
    })

    it("can find entities by prefix", async () => {
      const response = await storage.find({ text: findPrefix('search term') })
      expect(response).to.be.an('array')
      expect(response).to.have.length(1)
      response.forEach(expectEntity)
    })

    it("can find entities by suffix", async () => {
      const response = await storage.find({ text: findSuffix('search term') })
      expect(response).to.be.an('array')
      expect(response).to.have.length(1)
      response.forEach(expectEntity)
    })
  })
}

generateConfig().forEach(c => run(c))
