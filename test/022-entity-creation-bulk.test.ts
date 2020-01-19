import expect from 'expect.js'
import { Storage } from '../src'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const fixturesEvents = require('./fixtures/data/events')
const fixtureSchemata = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata
})

const { canFind, canCreateCollection } = createSteps(storage)

describe('Bulk entity creation', () => {
  before(() => storage.up())
  after(() => storage.down())

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
