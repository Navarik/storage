import expect from 'expect.js'
import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { expectEntity } from './steps/checks'
import { EntitySteps } from './steps/entities'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity> = require('./fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity> = require('./fixtures/data/job-orders.json')
const fixturesUsers: Array<CanonicalEntity> = require('./fixtures/data/users.json')
const fixturesMessages: Array<CanonicalEntity> = require('./fixtures/data/messages.json')

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages
]

const storage = new Storage({
  schema: fixtureSchemata,
  data: fixtureData,
  logger: nullLogger
})

const steps = new EntitySteps(storage)

describe('Entity search', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can't get none-existing entities", async () => {
    const response = await storage.get('doge', 'nope')
    expect(response).to.be(undefined)
  })

  it("can find by complete bodies: timelog events", async () => {
    await Promise.all(fixtureData.map(x => steps.canFind('doge', x)))
  })

  it("can find entities by type", async () => {
    const response = await storage.find('doge', { type: 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixturesEvents.length)
    response.forEach(entity => {
      expectEntity(entity)
      expect(entity.type).to.equal('timelog.timelog_event')
    })
  })

  it("can find entities by one field", async () => {
    const response = await storage.find('doge', { 'body.sender': '1' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(6)
    response.forEach(expectEntity)
  })

  it("can find entities by combination of fields", async () => {
    let response = await storage.find('doge', { 'body.sender': '1', 'body.job_order': '13' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(5)
    response.forEach(expectEntity)
  })

  it("can find entities by type and combination of fields", async () => {
    let response = await storage.find('doge', { 'body.sender': '1', 'body.job_order': '13', 'type': 'timelog.timelog_event' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(entity => {
      expectEntity(entity)
      expect(entity.type).to.equal('timelog.timelog_event')
    })
  })

  it("can't find what's not there", async () => {
    const response = await storage.find('doge', { 'body.sender': '100500' })
    expect(response).to.be.an('array')
    expect(response).to.have.length(0)
  })
})
