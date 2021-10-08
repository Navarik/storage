import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata = [
  {
    name: "channel",
    fields: [
      { name: "name", type: "string" }
    ]
  },
  {
    name: "user.group",
    fields: [
      { name: "name", type: "string" }
    ]
  },
  {
    name: "user",
    fields: [
      { name: "name", type: "string" },
      { name: "group", type: "reference" }
    ]
  },
  {
    name: "message",
    fields: [
      { name: "channel", type: "reference" },
      { name: "user", type: "reference" },
      { name: "content", type: "text" },
      { name: "tags", type: "map", parameters: { values: { type: "string" } } }
    ]
  }
]

const fixtureData = [
  { id: "583f2224-1b9d-4266-962a-2b1b7b0509bb", type: "channel", body: { name: "random" } },
  { id: "22956b03-1f99-49b0-830a-1e3c7d4beeef", type: "channel", body: { name: "memes" } },
  { id: "418f1fe9-5796-46f7-859c-9c99ea679d61", type: "user.group", body: { name: "us" } },
  { id: "65c0ad72-9f84-4789-a331-e4fc14dffab1", type: "user.group", body: { name: "them" } },
  { id: "f418ebfe-6046-47b5-81c1-165dde885278", type: "user", body: { name: "doge", group: "418f1fe9-5796-46f7-859c-9c99ea679d61" } },
  { id: "41ff2da7-652a-49d4-be5e-8ba6735c83c0", type: "user", body: { name: "whale", group: "418f1fe9-5796-46f7-859c-9c99ea679d61" } },
  { id: "51d73d52-b209-429c-b374-f4f7e2e2f028", type: "user", body: { name: "cat", group: "65c0ad72-9f84-4789-a331-e4fc14dffab1" } },

  { type: "message", body: { content: "wow", user: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "such", group: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "much", group: "65c0ad72-9f84-4789-a331-e4fc14dffab1", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "so", user: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "very", group: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "amaze", group: "65c0ad72-9f84-4789-a331-e4fc14dffab1", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },

  { type: "message", body: { content: "is this a pegeon?", user: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
  { type: "message", body: { content: "always has been", group: "418f1fe9-5796-46f7-859c-9c99ea679d61", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } },
]

export const searchDeep = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: fixtureData,
    logger: nullLogger
  })

  describe('Deep search', () => {
    before(() => storage.up())

    it("can find entities by referenced fields", async () => {
      const response = await storage.count({
        "type": "message",
        "body.channel.body.name": "random"
      })
      expect(response).to.equal(6)
    })

    after(() => storage.down())
  })
}
