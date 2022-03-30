import { expect } from "chai"
import { CanonicalSchema, CanonicalEntity, StorageConfig, StorageInterface } from '../../src'
import { EntitySteps } from '../steps/entity'
import { nullLogger } from "../mocks/null-logger"
import { expectEntity } from '../steps/checks'
import { OnlyMineAccessControl } from "../mocks/only-mine-acl"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users').default
const fixturesMessages: Array<CanonicalEntity<any, any>> = require('../fixtures/data/messages').default

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

  const dataSteps = new EntitySteps(storage)

  describe('Entity multi-user search given creator-only access control strategy', () => {
    before(async () => {
      await storage.up()
      await Promise.all(fixtureDataA.map(x => storage.create(x, userA)))
      await Promise.all(fixtureDataB.map(x => storage.create(x, userB)))
    })

    it("can find entities as a user", async () => {
      await Promise.all(fixtureDataA.map(x => dataSteps.canFind(x, userA)))
      await Promise.all(fixtureDataB.map(x => dataSteps.canFind(x, userB)))
    })

    it("cannot find by incorrect user and complete bodies", async () => {
      await Promise.all(fixtureDataA.map(x => dataSteps.cannotFind(x, userB)))
      await Promise.all(fixtureDataB.map(x => dataSteps.cannotFind(x, userA)))
      await Promise.all(fixtureDataA.map(x => dataSteps.cannotFind(x)))
    })

    it("cannot find by unspecified user", async () => {
      await Promise.all(fixtureDataA.map(x => dataSteps.cannotFind(x)))
      await Promise.all(fixtureDataB.map(x => dataSteps.cannotFind(x)))
    })

    it("can find entities by user and one field", async () => {
      const response = await storage.find({ 'body.sender': 1 }, {}, userA)
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
      response.forEach(expectEntity)
    })

    after(() => storage.down())
  })
}
