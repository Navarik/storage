import expect from 'expect.js'
import createStorage from '../src'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import fixturesEvents from './fixtures/data/events.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixturesUsers from './fixtures/data/users.json'
import fixturesMessages from './fixtures/data/messages.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'

const storage = createStorage({
  schema: fixtureSchemata
})

const { canCreate, cannotCreate, canFind } = createSteps(storage)

describe("Entity search", () => {
  before(() => storage.init())

  it("correctly creates new entities: timelog events", forAll(fixturesEvents, canCreate('timelog.timelog_event')))
  it("correctly creates new entities: job orders", forAll(fixturesJobs, canCreate('document.job_order')))
  it("correctly creates new entities: users", forAll(fixturesUsers, canCreate('profile.user')))
  it("correctly creates new entities: messages", forAll(fixturesMessages, canCreate('chat.text_message')))

  it("can find by complete bodies: timelog events", forAll(fixturesEvents, canFind))
  it("can find by complete bodies: job orders", forAll(fixturesJobs, canFind))
  it("can find by complete bodies: users", forAll(fixturesUsers, canFind))
  it("can find by complete bodies: messages", forAll(fixturesMessages, canFind))

  it("can find entities by type", async () => {
    const response = await storage.find({ type: 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(entity => {
      expectEntity(entity)
      expect(entity.version).to.equal(1)
      expect(entity.type).to.equal('timelog.timelog_event')
    })
  })

  it("can find entities by one field", async () => {
    const response = await storage.find({ sender: '1' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(6)
    response.forEach(expectEntity)
  })

  it("can find entities by combination of fields", async () => {
    let response = await storage.find({ sender: '1', job_order: '13' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)

    response = await storage.find({ sender: 1, job_order: 13 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)
  })

  it("can find entities by type and combination of fields", async () => {
    let response = await storage.find({ sender: '1', job_order: '13', type: 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(entity => {
      expectEntity(entity)
      expect(entity.version).to.equal(1)
      expect(entity.type).to.equal('timelog.timelog_event')
    })

    response = await storage.find({ sender: 1, job_order: 13, type: 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
  })
})
