import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixturesEvents from './fixtures/data/events'
import * as fixtureSchemata from './fixtures/schemata/schemata'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const storage = createStorage({
  schema: fixtureSchemata
})

const { canFind, canCreateCollection } = createSteps(storage)

describe('Bulk entity creation', () => {
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
