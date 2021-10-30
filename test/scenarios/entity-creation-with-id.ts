import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"

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

  describe('Entity creation with pre-defined IDs', () => {
    before(() => storage.up())

    it("can create entities with pre-defined IDs", async () => {
      await Promise.all(users.map(x => storage.create(x)))
      expect(await storage.count({ "type": "user" })).to.equal(3)
    })

    it("can get created entities", async () => {
      for (const user of users) {
        const result = await storage.get(user.id)
        expect(result.id).to.equal(user.id)
        expect(result.body).to.deep.equal(user.body)
      }
    })

    it("can't create entities with duplicate IDs", async () => {
      for (const user of userDuplicates) {
        try {
          await storage.create(user)
        } catch (error) {
          expect(error.name).to.equal("ConflictError")
          continue
        }

        expect(true).to.equal(false, "Expected error didn't happen.")
      }
    })

    it("verify that no duplicates has been created", async () => {
      expect(await storage.count({ "type": "user" })).to.equal(3)

      for (const user of users) {
        const result = await storage.get(user.id)
        expect(result.id).to.equal(user.id)
        expect(result.body).to.deep.equal(user.body)
      }
    })

    after(() => storage.down())
  })
}
