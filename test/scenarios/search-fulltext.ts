import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata = [
  {
    name: "message",
    fields: [
      { name: "user", type: "string" },
      { name: "content", type: "text" }
    ]
  },
  {
    name: "file",
    fields: [
      { name: "name", type: "string" },
      { name: "type", type: "string" },
      { name: "description", type: "text" }
    ]
  }
]

const fixtureData = [
  { type: "message", body: { content: "wow", user: "doge" } },
  { type: "message", body: { content: "such", user: "doge" } },
  { type: "message", body: { content: "much", user: "cat" } },
  { type: "message", body: { content: "so", user: "doge" } },
  { type: "message", body: { content: "very", user: "cat" } },
  { type: "message", body: { content: "amaze", user: "whale" } },
  { type: "message", body: { content: "is this a pegeon?", user: "doge" } },
  { type: "message", body: { content: "always has been", user: "doge" } },

  { type: "file", body: { description: "so much doge", user: "doge", name: "meme1" } },
  { type: "file", body: { description: "wow such much", user: "doge", name: "meme1" } },
  { type: "file", body: { description: "so very amaze", user: "doge", name: "meme2" } },
  { type: "file", body: { description: "he protec", user: "cat", name: "meme3" } },
]

export const searchFulltext = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: fixtureData,
    logger: nullLogger
  })

  describe('Full-text search', () => {
    before(() => storage.up())

    it("can find entities by text", async () => {
      expect(await storage.count({ operator: "fulltext", args: ["amaze"] })).to.equal(2)
      expect(await storage.count({ operator: "fulltext", args: ["protec"] })).to.equal(1)
      expect(await storage.count({ operator: "fulltext", args: ["much"] })).to.equal(3)
    })

    after(() => storage.down())
  })
}
