import expect from 'expect.js'
import { Storage } from '../src'
import { expectEntity } from './steps/checks'
import { forAll } from './steps/generic'
import { createSteps } from './steps/entities'

const fixtureSchemata = require('./fixtures/schemata')
const fixturesEvents = require('./fixtures/data/events.json')
const fixturesJobs = require('./fixtures/data/job-orders.json')
const fixturesUsers = require('./fixtures/data/users.json')
const fixturesMessages = require('./fixtures/data/messages.json')

const storage = new Storage({
  schema: fixtureSchemata
})

const { canCreate, canFind } = createSteps(storage)

describe('Entity search', () => {
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
  })

  it("can find entities by type and combination of fields", async () => {
    let response = await storage.find({ sender: '1', job_order: '13', type: 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(entity => {
      expectEntity(entity)
      expect(entity.type).to.equal('timelog.timelog_event')
    })
  })

  // it("can find entities by case-insensitive substring", async () => {
  //   const response = await storage.find({ text: findSubstring('search term') })
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(3)
  //   response.forEach(expectEntity)
  // })

  // it("properly escapes regex chaf in substrings", async () => {
  //   const response = await storage.find({ text: findSubstring('search.term') })
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(1)
  //   response.forEach(expectEntity)
  // })

  // it("can find entities by prefix", async () => {
  //   const response = await storage.find({ text: findPrefix('search term') })
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(1)
  //   response.forEach(expectEntity)
  // })

  // it("can find entities by suffix", async () => {
  //   const response = await storage.find({ text: findSuffix('search term') })
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(1)
  //   response.forEach(expectEntity)
  // })
})
