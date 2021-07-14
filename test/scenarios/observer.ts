import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, ChangeEvent, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { PersistentInMemoryChangelog } from "../fixtures/persistent-in-memory-changelog"
import { EntitySteps } from "../steps/entities"

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
  const results: Array<ChangeEvent<any, any>> = []

  describe('Observing changes', () => {
    it("can observe entity changes", async () => {
      storage.observe((x) => { results.push(x) })

      await storage.up()

      for (const entity of fixturesJobs) {
        await storage.create(entity)
      }

      expect(results).to.be.an('array')
      // Jobs were created once
      expect(results).to.have.length(fixturesJobs.length)

      for (const entity of fixturesEvents) {
        await storage.create(entity)
      }

      expect(results).to.be.an('array')
      // Jobs were created once and events were created once
      expect(results).to.have.length(fixturesJobs.length + fixturesEvents.length)

      await storage.down()
    })

    it("ignores errors thrown in observers", async () => {
      storage.observe(() => { throw new Error("Onoz!!!!") })

      await storage.up()

      for (const entity of fixturesJobs) {
        await steps.canCreate(entity)
      }

      // Jobs were created 2 times and events were created once
      const expectedCount = 2 * fixturesJobs.length + fixturesEvents.length
      expect(await storage.count({})).to.eql(expectedCount)
      expect(results).to.have.length(expectedCount)

      await storage.down()
    })

    it("doesn't observe previously recorder events when restarted", async () => {
      await storage.up()

      for (const entity of fixturesJobs) {
        await steps.canCreate(entity)
      }

      // Jobs were created 3 times and events were created once
      const expectedCount = 3 * fixturesJobs.length + fixturesEvents.length
      expect(await storage.count({})).to.eql(expectedCount)
      expect(results).to.have.length(expectedCount)

      await storage.down()
    })
  })
}
