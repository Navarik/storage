import expect from 'expect.js'
import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { EntitySteps } from './steps/entities'
import { nullLogger } from "./fixtures/null-logger"
import { expectEntity } from './steps/checks'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity> = require('./fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity> = require('./fixtures/data/job-orders.json')
const fixturesUsers: Array<CanonicalEntity> = require('./fixtures/data/users.json')
const fixturesMessages: Array<CanonicalEntity> = require('./fixtures/data/messages.json')

const userA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const userB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const fixtureDataA = [
  ...fixturesEvents,
  ...fixturesJobs
]

const fixtureDataB =[
  ...fixturesUsers,
  ...fixturesMessages
]

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

const steps = new EntitySteps(storage)

describe('Entity multiuser search', () => {
  before(async () => {
    storage.up()
    await storage.createBulk(fixtureDataA, userA)
    await storage.createBulk(fixtureDataB, userB)
  })
  after(() => storage.down())

  it("can find by user and complete bodies", async () => {
    await Promise.all(fixtureDataA.map(x => steps.canFind(x, userA)))
  })

  it("cannot find by incorrect user and complete bodies", async () => {
    await Promise.all(fixtureDataA.map(x => steps.cannotFind(x, userB)))
  })

  it("can find entities by user and one field", async () => {
    const response = await storage.find({ 'body.sender': '1' }, {}, userA)
    expect(response).to.be.an('array')
    expect(response).to.have.length(2)
    response.forEach(expectEntity)
  })
})
