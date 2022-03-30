import { expect } from "chai"
import { nullLogger } from "../mocks/null-logger"
import { StorageInterface, StorageConfig } from "../../src"
import { EntitySteps } from "../steps/entity"
import { SchemaSteps } from "../steps/schema"
import { SearchSteps } from "../steps/search"
import fixtureSchemata from "../fixtures/schemata.json"

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
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const dataSteps = new EntitySteps(storage)
  const searchSteps = new SearchSteps(storage)
  const schemaSteps = new SchemaSteps(storage)

  describe("Schema management", () => {
    before(() => storage.up())

    it("has statically defined types", async () => {
      expect(storage.types()).to.have.length(fixtureSchemata.length)
      fixtureSchemata.forEach(schema =>
        schemaSteps.canFindSchema(schema)
      )
    })

    it("allows defining new types", async () => {
      schemaSteps.canDefineType({
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
      schemaSteps.canDefineType({
        name: "doge",
        fields: [
          { name: "very", type: "int" },
          { name: "much", type: "int" }
        ]
      })
    })

    it("only latest version of the type is visible", async () => {
      expect(storage.types()).to.have.length(fixtureSchemata.length + 1)
      schemaSteps.canFindSchema({
        name: "doge",
        fields: [
          { name: "very", type: "int" },
          { name: "much", type: "int" }
        ]
      })
      schemaSteps.cannotFindSchema({
        name: "doge",
        fields: [
          { name: "such", type: "string" },
          { name: "much", type: "string" }
        ]
      })
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
