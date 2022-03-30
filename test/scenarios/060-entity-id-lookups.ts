import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"
import { expectSameEntity } from "../steps/checks"

const catId = "9913a4d3-4f64-45ca-8ef9-4e5d1f3ad4b3"
const dogeId = "17c43a4a-b8ee-49fc-b760-8060ac6877c0"

const cat = {
  id: catId,
  type: "cat",
  body: {
    meow: true
  }
}

export const entityIdLookups = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: [{
      name: "cat",
      fields: [
        { name: "meow", type: "boolean" }
      ]
    }],
    logger: nullLogger
  })

  describe('Entity lookups by ID', () => {
    before(async () => {
      await storage.up()
      await storage.create(cat)
    })

    it("can haz existing entity", async () => {
      expect(await storage.has(catId)).to.be.true
      expectSameEntity(await storage.get(catId), cat)
    })

    it("can't haz non-existing entities", async () => {
      expect(await storage.has(dogeId)).to.be.false
      expect(await storage.has("00000000-0000-0000-0000-000000000000")).to.be.false

      expect(await storage.get(dogeId)).to.be.undefined
      expect(await storage.get("00000000-0000-0000-0000-000000000000")).to.be.undefined
    })

    after(() => storage.down())
  })
}
