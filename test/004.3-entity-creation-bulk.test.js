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

  describe(`Bulk entity creation, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())

    it("correctly creates collection of new entities",
      canCreateCollection('timelog.timelog_event', fixturesEvents)
    )
    it("can find created entities", forAll(fixturesEvents, canFind))

    it("correct number of entities is created", async () => {
      const response = await storage.find()
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
    })
  })
}

generateConfig().forEach(c => run(c))
