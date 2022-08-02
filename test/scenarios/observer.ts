import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"
import { PersistentInMemoryChangelog } from "../mocks/persistent-in-memory-changelog"
import { EntitySteps } from "../steps/entity"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default

export const observer = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    changelog: new PersistentInMemoryChangelog(),
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Observing changes', () => {
    it("can observe entity changes", async () => {
      let results = 0
      storage.observe(() => { results++ })

      await storage.up()

      for (const entity of fixturesJobs) {
        await storage.create(entity)
      }

      // Jobs were created once
      expect(results).to.equal(fixturesJobs.length)

      for (const entity of fixturesEvents) {
        await storage.create(entity)
      }

      // Jobs were created once and events were created once
      expect(results).to.equal(fixturesJobs.length + fixturesEvents.length)

      await storage.down()
    })

    it("ignores errors thrown in observers", async () => {
      let results = 0
      storage.observe(() => { results++ })
      storage.observe(() => { throw new Error("Onoz!!!!") })

      await storage.up()

      for (const entity of fixturesJobs) {
        await steps.canCreate(entity)
      }

      // Jobs were created 2 times and events were created once
      const expectedCount = 2 * fixturesJobs.length + fixturesEvents.length
      expect(await storage.count({})).to.eql(expectedCount)

      // Only the jobs got observed
      expect(results).to.equal(fixturesJobs.length)

      await storage.down()
    })

    it("doesn't observe previously recorder events when restarted", async () => {
      let results = 0
      storage.observe(() => { results++ })

      await storage.up()

      for (const entity of fixturesJobs) {
        await steps.canCreate(entity)
      }

      // Jobs were created 3 times and events were created once
      const expectedCount = 3 * fixturesJobs.length + fixturesEvents.length
      expect(await storage.count({})).to.eql(expectedCount)

      // Only the jobs got observed
      expect(results).to.equal(fixturesJobs.length)

      await storage.down()
    })
  })
}
