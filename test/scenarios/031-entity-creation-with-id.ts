import { expect } from "chai"
import { StorageInterface, StorageConfig } from "../../src"
import { nullLogger } from "../mocks/null-logger"
import { EntitySteps } from "../steps/entity"

const fixtureSchemata = [
  {
    name: "user",
    fields: [
      { name: "name", type: "string" },
      { name: "email", type: "text" }
    ]
  }
]

const users = [
  { id: "f418ebfe-6046-47b5-81c1-165dde885278", type: "user", body: { name: "doge", email: "doge@aaa.com" } },
  { id: "41ff2da7-652a-49d4-be5e-8ba6735c83c0", type: "user", body: { name: "whale", email: "whale@aaa.com" } },
  { id: "51d73d52-b209-429c-b374-f4f7e2e2f028", type: "user", body: { name: "cat", email: "cat@aaa.com" } },
]

const userDuplicates = [
  { id: "f418ebfe-6046-47b5-81c1-165dde885278", type: "user", body: { name: "AAAAAAAA", email: "doge@aaa.com" } },
  { id: "41ff2da7-652a-49d4-be5e-8ba6735c83c0", type: "user", body: { name: "OOOOOOOO", email: "whale@aaa.com" } },
  { id: "51d73d52-b209-429c-b374-f4f7e2e2f028", type: "user", body: { name: "EEEEEEE", email: "cat@aaa.com" } },
]

export const entityCreationWithId = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const dataSteps = new EntitySteps(storage)

  describe("Entity creation with pre-defined IDs", () => {
    before(() => storage.up())

    it("can create entities with pre-defined IDs", async () => {
      await Promise.all(users.map(x => storage.create(x)))
      expect(await storage.count({ "type": "user" })).to.equal(3)
      expect(await storage.find({ "type": "user" })).to.have.length(3)
    })

    it("can not create entities with duplicate IDs", async () => {
      userDuplicates.forEach(async (x) => {
        const error = await dataSteps.cannotCreate(x)
        expect(error.name).to.equal("ConflictError")
      })
    })

    it("verify that no duplicates has been created", async () => {
      expect(await storage.count({ "type": "user" })).to.equal(3)
      expect(await storage.find({ "type": "user" })).to.have.length(3)
    })

    after(() => storage.down())
  })
}
