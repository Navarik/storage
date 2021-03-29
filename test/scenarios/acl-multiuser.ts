import { expect } from "chai"
import { CanonicalSchema, CanonicalEntity, StorageConfig, StorageInterface } from '../../src'
import { EntitySteps } from '../steps/entities'
import { nullLogger } from "../fixtures/null-logger"
import { expectEntity } from '../steps/checks'
import { OnlyMineAccessControl } from "../fixtures/only-mine-acl"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders.json')
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users.json')
const fixturesMessages: Array<CanonicalEntity<any, any>> = require('../fixtures/data/messages.json')

const userA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const userB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const fixtureDataA = [
  ...fixturesEvents,
  ...fixturesJobs
]

const fixtureDataB = [
  ...fixturesUsers,
  ...fixturesMessages
]

export const aclMultiuser = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger,
    accessControl: new OnlyMineAccessControl()
  })

  const steps = new EntitySteps(storage)

  describe('Entity multi-user search given creator-only access control strategy', () => {
    before(async () => {
      await storage.up()
      await Promise.all(fixtureDataA.map(x => storage.create(x, "AAAAAA", userA)))
      await Promise.all(fixtureDataB.map(x => storage.create(x, "BBBBBB", userB)))
    })
    after(() => storage.down())

    it("can find by user and complete bodies", async () => {
      await Promise.all(fixtureDataA.map(x => steps.canFind(x, userA)))
      await Promise.all(fixtureDataB.map(x => steps.canFind(x, userB)))
    })

    it("cannot find by incorrect user and complete bodies", async () => {
      await Promise.all(fixtureDataA.map(x => steps.cannotFind(x, userB)))
      await Promise.all(fixtureDataB.map(x => steps.cannotFind(x, userA)))
      await Promise.all(fixtureDataA.map(x => steps.cannotFind(x)))
    })

    it("cannot find by unspecified user", async () => {
      await Promise.all(fixtureDataA.map(x => steps.cannotFind(x)))
      await Promise.all(fixtureDataB.map(x => steps.cannotFind(x)))
    })

    it("can find entities by user and one field", async () => {
      const response = await storage.find({ 'body.sender': '1' }, {}, userA)
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
      response.forEach(expectEntity)
    })
  })
}
