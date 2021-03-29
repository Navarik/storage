import { expect } from "chai"
import { Storage, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { EntitySteps } from '../steps/entities'

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events')

export const entityCreationFlow = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => Storage<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Entity creation flow', () => {
    before(() => storage.up())
    after(() => storage.down())

    it("doesn't have entities before they are created", async () => {
      const response = await storage.find()
      expect(response).to.be.an("array")
      expect(response).to.be.empty
    })

    it("correctly creates new entities", async () => {
      await Promise.all(fixturesEvents.map(x => steps.canCreate(x)))
    })

    it("can find created entities", async () => {
      await Promise.all(fixturesEvents.map(x => steps.canFind(x)))
    })

    it("allows duplicates", async () => {
      await Promise.all(fixturesEvents.map(x => steps.canCreate(x)))
    })

    it("correct number of entities is created", async () => {
      const response = await storage.find()
      expect(response).to.be.an('array')
      expect(response).to.have.length(fixturesEvents.length * 2)
    })
  })
}
