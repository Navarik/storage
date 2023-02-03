import { expect } from 'chai'
import { StorageInterface, StorageConfig, EntityEnvelope } from '../../src'
import { nullLogger } from "../mocks/null-logger"
import { EntitySteps } from '../steps/entity'

export const entityDeletion = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: [{
      name: "user",
      fields: [
        { name: "email", type: "string", required: true },
        { name: "name", type: "string" }
      ]
    }],
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)
  let testEntity: EntityEnvelope

  describe('Entity deletion', () => {
    before(() => storage.up())

    it("does nothing when deleting non-existing entity", async () => {
      expect(await storage.delete("9913a4d3-4f64-45ca-8ef9-4e5d1f3ad4b3")).to.be.undefined
    })

    it("can delete entity", async () => {
      testEntity = await steps.canCreate({ type: "user", body: { email: "doge" }})
      await steps.canDelete(testEntity.id)
      expect(await storage.count()).to.equal(0)
    })

    it("does nothing when deleting entity more than once", async () => {
      expect(await storage.delete(testEntity.id)).to.be.undefined
      expect(await storage.delete(testEntity.id)).to.be.undefined
    })

    after(() => storage.down())
  })
}
