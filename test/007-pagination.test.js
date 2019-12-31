import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixtureSchemata from './fixtures/schemata/schemata.json'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'
import * as fixturesUsers from './fixtures/data/users.json'
import * as fixturesMessages from './fixtures/data/messages.json'
import { expectEntity } from './steps/checks'

const storage = createStorage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs,
    'profile.user': fixturesUsers,
    'chat.text_message': fixturesMessages
  }
})

describe('Search pagination', () => {
  before(() => storage.init())

  it("can limit the search results", async () => {
    let response = await storage.find({ sender: '1', job_order: '13' }, { limit: 2 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)

    response = await storage.find({ sender: 1, job_order: 13 }, { limit: 10 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)
  })

  it("limit 0 is not applied", async () => {
    const response = await storage.find({ sender: '1', job_order: '13' }, { limit: 0 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)
  })

  it("limit 0 is not applied (with offset)", async () => {
    const response = await storage.find({ sender: '1', job_order: '13' }, { limit: 0, offset: 3 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)
  })

  it("invalid offset and limit are not applied", async () => {
    let response = await storage.find({ sender: '1', job_order: '13'}, { limit: 'invalidOffset', offset: 'ff0000'})
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)
  })

  it("can offset the search results", async () => {
    let response = await storage.find({ sender: '1', job_order: '13' }, { limit: 2, offset: 2 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)

    response = await storage.find({ sender: '1', job_order: '13' }, { limit: 2, offset: 4 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    response.forEach(expectEntity)

    response = await storage.find({ sender: '1', job_order: '13' }, { limit: 2, offset: 0 })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)
  })

  it("can offset and limit with sort", async () => {
    let response = await storage.find({ sender: '1', job_order: '13'}, { limit: 2, offset: 2, sort: ['timestamp:asc'] })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)
  })

  it("can offset and limit with numeric string as input", async () => {
    // test with string limit and offset, which is a common case when these parameters are retrieved from request query params.
    let response = await storage.find({ sender: '1', job_order: '13'}, { limit: '2', offset: '2', sort: ['timestamp:asc'] })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)
  })
})
