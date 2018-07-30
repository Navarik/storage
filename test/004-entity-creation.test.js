import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'

const storage = createStorage({
  schema: fixtureSchemata
})

const { canCreate, cannotCreate, canFind, canCreateCollection } = createSteps(storage)

describe("Entity format and constraints", () => {
  before(() => storage.init())

  it("can't create entity of unknown type", cannotCreate('wow.doge', {}))
  it("can't create empty entity", cannotCreate('profile.user', {}))
  it("can't create malformed entity", cannotCreate('profile.user', {
    role: 100500,
    last_name: ["Lisa"],
    first_name: false,
    company: "Alpha Oil Co",
    email: "lking@test.abc"
  }))

  it("can create properly structured entity", canCreate('profile.user', {
    role: "Doge",
    last_name: "Such",
    first_name: "Much",
    company: "Alpha Oil Co",
    email: "lking@test.abc"
  }))
})

describe("Entity creation flow", () => {
  before(() => storage.init())

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

// describe("Bulk entity creation", () => {
//   before(() => storage.init())

//   it("correctly creates collection of new entities",
//     canCreateCollection('timelog.timelog_event', fixturesEvents)
//   )
//   it("can find created entities", forAll(fixturesEvents, canFind))

//   it("correct number of entities is created", async () => {
//     const response = await storage.find()
//     expect(response).to.be.an('array')
//     expect(response).to.have.length(5)
//   })
// })
