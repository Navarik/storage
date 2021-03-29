import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"

const catId = "9913a4d3-4f64-45ca-8ef9-4e5d1f3ad4b3"
const dogeId = "17c43a4a-b8ee-49fc-b760-8060ac6877c0"

export const entityHas = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: [{
      "type": "cat",
      "fields": {
        "meow": "boolean"
      }
    }],
    data: [{
      "id": catId,
      "type": "cat",
      "body": {
        "meow": true
      }
    }],
    logger: nullLogger
  })

  describe('Entity existance', () => {
    before(() => storage.up())
    after(() => storage.down())

    it("can haz existing entity", async () => {
      expect(await storage.has(catId)).to.be.true
    })

    it("can't haz non-existing entities", async () => {
      expect(await storage.has(dogeId)).to.be.false
      expect(await storage.has("00000000-0000-0000-0000-000000000000")).to.be.false
    })
  })
}
