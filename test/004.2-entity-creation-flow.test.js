import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    ...config,
  })

  const { canCreate, cannotCreate, canFind, canCreateCollection } = createSteps(storage)

  describe(`Entity creation flow, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())
    after(() => {
      if (config.index.cleanup) {
        return config.index.cleanup()
      }
    })

    it("doesn't have entities before they are created", async () => {
      const response = await storage.find()
      expect(response).to.be.an('array')
      expect(response).to.be.empty()
    })

    it("correctly creates new entities", forAll(fixturesEvents, canCreate('timelog.timelog_event')))
    it("can find created entities", forAll(fixturesEvents, canFind))
    it("allows duplicates", forAll(fixturesEvents, canCreate('timelog.timelog_event')))

    it("correct number of entities is created", async () => {
      const response = await storage.find()
      expect(response).to.be.an('array')
      expect(response).to.have.length(10)
    })
  })
}

generateConfig().forEach(c => run(c))
