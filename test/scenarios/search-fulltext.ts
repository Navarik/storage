import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../mocks/null-logger"

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
  },
  {
    name: "meme",
    fields: [
      { name: "name", type: "string" },
      { name: "content", type: "array", parameters: {
        items: { type: "text" }
      } }
    ]
  }
]

const fixtureData = [
  { id: "583f2224-1b9d-4266-962a-2b1b7b0509bb", type: "message", body: { content: "wow", user: "doge" } },
  { id: "22956b03-1f99-49b0-830a-1e3c7d4beeef", type: "message", body: { content: "much", user: "doge" } },
  { type: "message", body: { content: "such", user: "cat" } },
  { type: "message", body: { content: "so", user: "doge" } },
  { type: "message", body: { content: "very", user: "cat" } },
  { type: "message", body: { content: "amaze", user: "whale" } },
  { type: "message", body: { content: "is this a pegeon?", user: "doge" } },
  { type: "message", body: { content: "always has been", user: "doge" } },

  { type: "file", body: { description: "so much doge", user: "doge", name: "meme1" } },
  { type: "file", body: { description: "wow such much", user: "doge", name: "meme1" } },
  { type: "file", body: { description: "so very amaze", user: "doge", name: "meme2" } },
  { type: "file", body: { description: "he protec", user: "cat", name: "meme3" } },

  { type: "meme", body: { name: "I don't always", content: ["I don't always test", "but when I do, I do it in production"] } },
  { type: "meme", body: { name: "doge", content: ["so test", "very wow"] } }
]

export const searchFulltext = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  describe('Full-text search', () => {
    before(async () => {
      await storage.up()
      await Promise.all(fixtureData.map(x => storage.create<any>(x)))
    })

    it("can count entities by text fragments", async () => {
      expect(await storage.count({ operator: "fulltext", args: ["amaze"] })).to.equal(2)
      expect(await storage.count({ operator: "fulltext", args: ["protec"] })).to.equal(1)
      expect(await storage.count({ operator: "fulltext", args: ["much"] })).to.equal(3)
      expect(await storage.count({ operator: "fulltext", args: ["test"] })).to.equal(2)
      expect(await storage.count({ operator: "fulltext", args: ["wow"] })).to.equal(3)
    })

    it("doesn't count deleted documents", async () => {
      await storage.delete("583f2224-1b9d-4266-962a-2b1b7b0509bb")
      await storage.delete("22956b03-1f99-49b0-830a-1e3c7d4beeef")

      expect(await storage.count({ operator: "fulltext", args: ["much"] })).to.equal(2)
      expect(await storage.count({ operator: "fulltext", args: ["wow"] })).to.equal(2)
    })

    after(() => storage.down())
  })
}
