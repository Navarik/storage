import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { EntitySteps } from '../steps/entity'
import { expectEntity } from '../checks'
import { nullLogger } from "../mocks/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default

export const metadata = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage<{ wow: string, very: number }>({
    schema: fixtureSchemata,
    meta: [
      { name: "wow", type: "string" },
      { name: "very", type: "int" }
    ],
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Metadata support', () => {
    before(() => storage.up())

    it("correctly creates entities with metadata", async () => {
      const fixtures = fixturesEvents.map(x => ({ ...x, meta: { wow: 'doge', very: 1 } }))
      await Promise.all(fixtures.map(x => steps.canCreate(x)))
    })

    it("can read metadata from created entities", async () => {
      const entities = await storage.find()
      for (const entity of entities) {
        expectEntity(entity)
        expect(entity.meta).to.be.an('object')
        expect(entity.meta.wow).to.equal('doge')
        expect(entity.meta.very).to.equal(1)
      }
    })

    it("can create default metadata if it's not required", async () => {
      const { id } = await steps.canCreate(fixturesEvents[0])
      const entity = await storage.get(id)
      expectEntity(entity)
      expect(entity?.meta).to.be.an('object')
      expect(entity?.meta.wow).to.equal(null)
      expect(entity?.meta.very).to.equal(null)
    })

    it("can find entities by metadata values", async () => {
      await Promise.all(fixturesEvents.map(x => steps.canCreate(x)))

      const allEntities = await storage.find()
      expect(allEntities).to.be.an('array')
      expect(allEntities).to.have.length(2 * fixturesEvents.length + 1)

      const selectedEntities = await storage.find({ 'meta.wow': 'doge' })
      expect(selectedEntities).to.be.an('array')
      expect(selectedEntities).to.have.length(fixturesEvents.length)
    })

    after(() => storage.down())
  })
}
