import { expect } from "chai"
import { nullLogger } from "../mocks/null-logger"
import { StorageInterface, StorageConfig } from "../../src"
import { EntitySteps } from "../steps/entity"
import { SearchSteps } from "../steps/search"
import schemas from "../fixtures/schemata.json"
import { createRunner } from "../setup"

interface TestData {
  such: string
  much: string
}

interface UpdatedTestData {
  very: number
  much: number
}

export const schemaManagement = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: schemas,
    logger: nullLogger
  })

  const runner = createRunner(storage)

  const dataSteps = new EntitySteps(storage)
  const searchSteps = new SearchSteps(storage)

  describe("Schema management", () => {
    before(() => storage.up())

    it("has statically defined types", async () => {
      schemas.forEach(x => runner.canSync("findSchema", x))
    })

    it("has no other types", async () => {
      expect(storage.types()).to.have.length(schemas.length)
    })

    it("allows defining new types", async () => {
      runner.canSync("defineSchema", {
        name: "doge",
        fields: [
          { name: "such", type: "string" },
          { name: "much", type: "string" }
        ]
      })
    })

    it("allows creating entities of the new type", async () => {
      await dataSteps.canCreate({
        type: "doge",
        body: { such: "wow", much: "approve" }
      })
      await dataSteps.canCreate({
        type: "doge",
        body: { such: "wow!!!!", much: "approve!!!!!" }
      })
    })

    it("allows updating types", async () => {
      runner.canSync("defineSchema", {
        name: "doge",
        fields: [
          { name: "very", type: "int" },
          { name: "much", type: "int" }
        ]
      })
    })

    it("can see the latest version of the type", async () => {
      runner.canSync("findSchema", {
        name: "doge",
        fields: [
          { name: "very", type: "int" },
          { name: "much", type: "int" }
        ]
      })
    })

    it("can not see previous versions of the type", async () => {
      expect(storage.types()).to.have.length(schemas.length + 1)

      const error = runner.cannotSync("findSchema", {
        name: "doge",
        fields: [
          { name: "such", type: "string" },
          { name: "much", type: "string" }
        ]
      })
      expect(error.name).to.equal("AssertionError")
    })

    it("allows manipulating previously created entities after the type has been updated", async () => {
      const collection = await searchSteps.canFind({ type: "doge" })
      await dataSteps.canDelete(collection[0].id)
    })

    it("treats old type as valid when updating old entities", async () => {
      const [entity] = await searchSteps.canFind<TestData>({ type: "doge" })
      entity.body.such = "AAAA"
      entity.body.much = "AAAAAAAAAAAAA"
      await dataSteps.cannotUpdate(entity)
    })

    it("allows to update old entities to the new type", async () => {
      const [entity] = await searchSteps.canFind<UpdatedTestData>({ type: "doge" })
      entity.body.very = 100
      entity.body.much = 500

      // "such" field is removed in the new type
      await dataSteps.canUpdate({ ...entity, body: { very: 100, much: 500 } })
    })

    it("allows creating entities of the updated type", async () => {
      await dataSteps.canCreate({
        type: "doge",
        body: { very: 1, much: 2 }
      })
    })

    after(() => storage.down())
  })
}
