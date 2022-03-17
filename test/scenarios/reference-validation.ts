import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { EntitySteps } from "../steps/entities"

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
      { name: "group", type: "reference", required: true }
    ]
  },
  {
    name: "message",
    fields: [
      { name: "channel", type: "reference", required: true },
      { name: "user", type: "reference", required: true },
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
]

export const referenceValidation = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Reference validation', () => {
    before(async () => {
      await storage.up()
      for (const fixture of fixtureData) {
        await storage.create<any>(fixture)
      }
    })

    it("can create entities when referenced objects exist", async () => {
      await steps.canCreate({ type: "message", body: { content: "is this a pegeon?", user: "51d73d52-b209-429c-b374-f4f7e2e2f028", channel: "22956b03-1f99-49b0-830a-1e3c7d4beeef" } })
      await steps.canCreate({ type: "message", body: { content: "always has been", user: "f418ebfe-6046-47b5-81c1-165dde885278", channel: "22956b03-1f99-49b0-830a-1e3c7d4beeef" } })
      expect(await storage.count({ "type": "message" })).to.equal(2)
    })

    it("can't create documents with missing referenced documents", async () => {
      await steps.cannotCreate({ type: "message", body: { content: "is this a pegeon?", user: "806f1bb9-c0a9-44dd-a0f6-9a8519be36d6", channel: "f94481ef-2a52-4f1d-a380-6ca0dcaa55b9" } })
      await steps.cannotCreate({ type: "message", body: { content: "is this a pegeon?", user: "f418ebfe-6046-47b5-81c1-165dde885278", channel: "7cc67b96-d5fd-4811-a5a7-7c31f5888670" } })
      await steps.cannotCreate({ type: "message", body: { content: "is this a pegeon?", user: "27a692ac-4c8c-4d82-a9ef-8413eb792a4e", channel: "583f2224-1b9d-4266-962a-2b1b7b0509bb" } })
    })

    after(() => storage.down())
  })
}
