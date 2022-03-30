import { expect } from "chai"
import { nullLogger } from "../mocks/null-logger"
import { StorageInterface, StorageConfig } from '../../src'

export const emptyState = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({ logger: nullLogger })

  describe('Empty state', () => {
    before(() => storage.up())

    it("has no types", async () => {
      expect(storage.types())
      .to.be.an("array")
      .to.be.empty
    })

    it("has no entities", async () => {
      expect(await storage.find())
      .to.be.an("array")
      .to.be.empty

      expect(await storage.count())
      .to.equal(0)
    })
  })

  after(() => storage.down())
}
