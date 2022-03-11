import { expect } from 'chai'
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { EntitySteps } from '../steps/entities'
import { expectSameEntity } from '../steps/checks'
import { nullLogger } from "../fixtures/null-logger"
import { PermissionsBasedAccessControl } from "../fixtures/permissions-based-acl"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default

const reader   = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const writer   = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const searcher = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

const acl = new PermissionsBasedAccessControl()
acl.grant(reader, "read")
acl.grant(writer, "write")
acl.grant(searcher, "search")


const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs
]

export const aclPermissions = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger,
    accessControl: acl
  })

  const steps = new EntitySteps(storage)
  const createdIds: Array<string> = []

  describe('Enforcing permissions based on ACL', () => {
    before(async () => { await storage.up() })

    it("read/search permission doesn't allow writes", async () => {
      await Promise.all(fixtureData.map(entity => steps.cannotCreate(entity, reader)))
      await Promise.all(fixtureData.map(entity => steps.cannotCreate(entity, searcher)))

      await Promise.all(fixtureData.map(async (entity) => {
        const created = await storage.create(entity, writer)
        createdIds.push(created.id)
        expectSameEntity(created, entity)
      }))
    })

    it("write permission doesn't allow reads/searches", async () => {
      await Promise.all(createdIds.map(async (id) => {
        expect(await storage.has(id)).to.be.true
        await steps.cannotGet(id, writer)
        await steps.cannotGet(id, searcher)
        expect(await storage.get(id, {}, reader)).to.be.an("object")
      }))
    })

    it("search permission doesn't allow writes/id-based reads", async () => {
      expect(await storage.find({}, {}, writer)).to.have.lengthOf(0)
      expect(await storage.find({}, {}, reader)).to.have.lengthOf(0)
      expect(await storage.find({}, { limit: 100 }, searcher)).to.have.lengthOf(createdIds.length)
    })

    it("write permission allows deletes", async () => {
      await Promise.all(createdIds.map(async (id) => {
        expect(await storage.has(id)).to.be.true
        await steps.cannotDelete(id, reader)
        await steps.cannotDelete(id, searcher)
        expect(await storage.delete(id, writer)).to.be.an("object")
      }))
    })

    after(() => storage.down())
  })
}
