import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { forAll } from './steps/generic'
import createSchemaSteps from './steps/schema'
import createEntitySteps from './steps/entities'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: {
      'timelog.timelog_event': fixturesEvents,
      'document.job_order': fixturesJobs,
    },
    ...config,
  })

  const schemaSteps = createSchemaSteps(storage)
  const entitySteps = createEntitySteps(storage)

  describe(`State reconstruction, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())

    it("should have pre-defined schemas", forAll(fixtureSchemata, schemaSteps.canFind))
    it("should have pre-defined entities", forAll(fixturesEvents, entitySteps.canFind))
    it("should have pre-defined entities of a different type", forAll(fixturesJobs, entitySteps.canFind))
  })
}

generateConfig().forEach(c => run(c))
