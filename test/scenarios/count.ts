import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default

export const count = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  describe('Entity counts', () => {
    before(async () => {
      await storage.up()
      await Promise.all([...fixturesEvents, ...fixturesJobs].map(x => storage.create(x)))
    })

    it("can count entities", async () => {
      const response = await storage.count()
      expect(response).to.equal(fixturesEvents.length + fixturesJobs.length)
    })

    it("can count entities with filters", async () => {
      const response1 = await storage.count({ type: 'timelog.timelog_event' })
      expect(response1).to.equal(fixturesEvents.length)

      const response2 = await storage.count({ type: 'document.job_order' })
      expect(response2).to.equal(fixturesJobs.length)
    })

    after(() => storage.down())
  })
}
