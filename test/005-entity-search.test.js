import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixturesUsers from './fixtures/data/users.json'
import fixturesMessages from './fixtures/data/messages.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

const { canCreate, cannotCreate } = createSteps(storage)

describe("Entity search", () => {
  before(() => storage.init({ schemata: 'file://./test/fixtures/schemata/source' }))

  it("Correctly creates new entities", forAll(fixturesEvents, canCreate('timelog.timelog_event')))
  it("Correctly creates new entities: job orders", forAll(fixturesJobs, canCreate('document.job_order')))
  it("Correctly creates new entities: users", forAll(fixturesUsers, canCreate('profile.user')))
  it("Correctly creates new entities: messages", forAll(fixturesMessages, canCreate('chat.text_message')))

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
