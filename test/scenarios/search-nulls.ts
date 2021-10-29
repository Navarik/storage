import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata = [
  {
    name: "bucket",
    fields: [
      { name: "array", type: "array", parameters: { items: { type: "string" } } },
      { name: "object", type: "object", parameters: { fields: [
        { name: "wow", type: "string" },
        { name: "such", type: "text" }
      ] } }
    ]
  }
]

const fixtureData = [
  { type: "bucket", body: {} },
  { type: "bucket", body: { array: null } },
  { type: "bucket", body: { array: [] } },
  { type: "bucket", body: { array: ["a", "b"] } },
  { type: "bucket", body: { object: null } },
  { type: "bucket", body: { object: { wow: "AAAAAAAA", such: "much" } } }
]

export const searchNulls = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: fixtureData,
    logger: nullLogger
  })

  describe('Deep search', () => {
    before(() => storage.up())

    it("doesn't break when searching objects with nullable composite fields", async () => {
      expect(await storage.count({ "body.object.wow": "AAAAAAAA" })).to.equal(1)
    })

    after(() => storage.down())
  })
}
