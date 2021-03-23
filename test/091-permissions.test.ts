import { expect } from 'chai'
import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { EntitySteps } from './steps/entities'
import { expectSameEntity } from './steps/checks'
import { nullLogger } from "./fixtures/null-logger"
import { PermissionsBasedAccessControl } from "./fixtures/permissions-based-acl"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('./fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('./fixtures/data/job-orders.json')

const reader = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const writer = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const acl = new PermissionsBasedAccessControl()
acl.grant(reader, "read")
acl.grant(writer, "write")

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs
]

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger,
  accessControl: acl
})

const steps = new EntitySteps(storage)
const createdIds: Array<string> = []

describe('Enforcing read and write permissions based on ACL', () => {
  before(async () => { await storage.up() })
  after(() => storage.down())

  it("read permission doesn't allow writes", async () => {
    await Promise.all(fixtureData.map(entity => steps.cannotCreate(entity, reader)))

    await Promise.all(fixtureData.map(async (entity) => {
      const created = await storage.create(entity, "AAAA", writer)
      createdIds.push(created.id)
      expectSameEntity(created, entity)
    }))
  })

  it("write permission doesn't allow reads", async () => {
    await Promise.all(createdIds.map(async (id) => {
      expect(await storage.has(id)).to.be.true
      expect(await storage.get(id, writer)).to.be.undefined
      expect(await storage.get(id, reader)).to.be.an("object")
    }))
  })
})
