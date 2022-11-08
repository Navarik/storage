import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"
import { PersistentInMemoryChangelog } from "../mocks/persistent-in-memory-changelog"
import { EntitySteps } from "../steps/entity"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users').default

export const observer = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  describe('Observing changes', () => {
    const changelog = new PersistentInMemoryChangelog()
    const storage = createStorage({
      schema: fixtureSchemata,
      changelog,
      logger: nullLogger
    })

    const steps = new EntitySteps(storage)

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

    it("ignore change events duplicated", async () => {
      let results = 0
      storage.observe(() => { results++ })

      await storage.up()

      await changelog.write({
        id: '3f035def-ea53-4142-81ed-09bbf634d2c0',
        action: 'create',
        entity: fixturesUsers[0],
        schema: fixtureSchemata[0],
      })

      await changelog.write({
        id: 'c80a42d4-dea3-4ecd-9db7-188434fc1c85',
        action: 'create',
        entity: fixturesUsers[1],
        schema: fixtureSchemata[0],
      })

      await changelog.write({
        id: '3f035def-ea53-4142-81ed-09bbf634d2c0',
        action: 'create',
        entity: fixturesUsers[0],
        schema: fixtureSchemata[0],
      })

      expect(results).to.equal(2)

      await storage.down()
    })
  })
}
