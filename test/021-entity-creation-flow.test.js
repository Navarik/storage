import * as expect from 'expect.js'
import { Storage } from '../src'
import * as fixtureSchemata from './fixtures/schemata'
import * as fixturesEvents from './fixtures/data/events'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const storage = new Storage({
  schema: fixtureSchemata
})

const { canCreate, canFind } = createSteps(storage)

describe('Entity creation flow', () => {
  before(() => storage.init())

  it("doesn't have entities before they are created", async () => {
    const response = await storage.find()
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  })

  it("can't get entities before they are created", async () => {
    const response = await storage.get('nope')
    expect(response).to.be.undefined
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
