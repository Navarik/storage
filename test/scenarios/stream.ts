import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
// import { expectEntity } from '../steps/checks'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users').default
const fixturesMessages: Array<CanonicalEntity<any, any>> = require('../fixtures/data/messages').default

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
