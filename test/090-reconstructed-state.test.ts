import { Storage } from '../src'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const fixtureSchemata = require('./fixtures/schemata')
const fixturesEvents = require('./fixtures/data/events.json')
const fixturesJobs = require('./fixtures/data/job-orders.json')

const storage = new Storage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs,
  }
})

const entitySteps = createSteps(storage)

describe('State reconstruction', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("should have pre-defined entities", forAll(fixturesEvents, entitySteps.canFind))
  it("should have pre-defined entities of a different type", forAll(fixturesJobs, entitySteps.canFind))
})
