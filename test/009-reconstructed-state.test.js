import * as createStorage from '../src'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'
import * as fixtureSchemata from './fixtures/schemata/schemata.json'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const storage = createStorage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs,
  }
})

const entitySteps = createSteps(storage)

describe('State reconstruction', () => {
  before(() => storage.init())

  it("should have pre-defined entities", forAll(fixturesEvents, entitySteps.canFind))
  it("should have pre-defined entities of a different type", forAll(fixturesJobs, entitySteps.canFind))
})
