import expect from 'expect.js'
import createStorage from '../src'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { forAll } from './steps/generic'
import createSchemaSteps from './steps/schema'
import createEntitySteps from './steps/entities'

class MockSchemaLogAdapter {
  on(topic, handler) {
    return 'nope'
  }

  write(topic, payload) {
    return nope
  }

  read(topic) {
    return fixtureSchemata
  }
}

class MockEntityLogAdapter {
  on(topic, handler) {
    return 'nope'
  }

  write(topic, payload) {
    return nope
  }

  read(topic) {
    if (topic === 'document.job_order') {
      return Promise.resolve(fixturesJobs)
    } else {
      return Promise.resolve([])
    }
  }
}

const storage = createStorage({
  log: {
    schema: new MockSchemaLogAdapter(),
    entity: new MockEntityLogAdapter()
  }
})

const schemaSteps = createSchemaSteps(storage)
const entitySteps = createEntitySteps(storage)

describe("Allows overriding changelog adapters", () => {
  before(() => storage.init())

  it("should have pre-defined schemas", forAll(fixtureSchemata, schemaSteps.canFind))
  it("should have pre-defined entities", forAll(fixturesJobs, entitySteps.canFind))
})
