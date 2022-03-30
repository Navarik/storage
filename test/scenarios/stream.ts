import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"
import fixtureSchemata from '../fixtures/schemata.json'
import fixturesEvents from '../fixtures/data/events'
import fixturesJobs from '../fixtures/data/job-orders'
import fixturesUsers from '../fixtures/data/users'
import fixturesMessages from '../fixtures/data/messages'

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages
]

export const stream = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  describe('Data stream', () => {
    before(async () => {
      await storage.up()
      await Promise.all(fixtureData.map(x => storage.create<any>(x)))
    })

    it("can stream all entities from storage", async () => {
      const streamQuery = storage.stream({}, {})

      const result = []
      for await (const entity of streamQuery) {
        result.push(entity)
      }

      expect(result).to.have.length(fixtureData.length)
    })

    it("can filter entity stream", async () => {
      const streamQuery = storage.stream({ 'body.sender': 1, 'body.job_order': 13 }, {})

      const result = []
      for await (const entity of streamQuery) {
        result.push(entity)
      }

      expect(result).to.have.length(5)
    })

    after(() => storage.down())
  })
}
