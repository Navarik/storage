import { expect } from "chai"
import { Storage, CanonicalSchema, CanonicalEntity, ChangeEvent, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { EntitySteps } from "../steps/entities"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events.json')
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders.json')

export const observer = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => Storage<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Observing changes', () => {
    before(() => storage.up())
    after(() => storage.down())

    it("can observe entity changes", async () => {
      const results: Array<ChangeEvent<any, any>> = []
      storage.observe((x) => { results.push(x) })

      for (const entity of fixturesJobs) {
        await storage.create(entity)
      }

      expect(results).to.be.an('array')
      expect(results).to.have.length(fixturesJobs.length)

      for (const entity of fixturesEvents) {
        await storage.create(entity)
      }

      expect(results).to.be.an('array')
      expect(results).to.have.length(fixturesJobs.length + fixturesEvents.length)
    })

    it("ignores errors thrown in observers", async () => {
      storage.observe(() => { throw new Error("Onoz!!!!") })

      for (const entity of fixturesJobs) {
        await steps.canCreate(entity)
      }

      expect(await storage.count({})).to.eql(fixturesJobs.length + fixturesJobs.length + fixturesEvents.length)
    })
  })
}
