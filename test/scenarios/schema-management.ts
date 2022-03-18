import { expect } from "chai"
import { nullLogger } from "../fixtures/null-logger"
import { StorageInterface, CanonicalSchema, StorageConfig } from '../../src'
import { EntitySteps } from '../steps/entities'

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')

export const schemaManagement = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {

  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  const testEntity1 = {
    type: "doge",
    body: { such: "wow", much: "approve" }
  }

  const testEntity2 = {
    type: "doge",
    body: { such: "wow!!!!", much: "approve!!!!!" }
  }

  const testEntityNew = {
    type: "doge",
    body: { very: 1, much: 2 }
  }

  describe('Schema management', () => {
    before(() => storage.up())
    after(() => storage.down())

    it("has no entities", async () => {
      const response = await storage.find()
      expect(response).to.be.an("array")
      expect(response).to.be.empty
    })

    it("has statically defined types", async () => {
      const response = storage.types()
      expect(response).to.be.an('array')
      expect(response).to.have.length(fixtureSchemata.length)

      fixtureSchemata.forEach(schema => {
        expect(response).to.contain(schema.name)
        expect(storage.describe(schema.name)).to.deep.equal(schema)
      })
    })

    it("allows defining new types", async () => {
      const schema = {
        name: "doge",
        fields: [
          { name: "such", type: "string" },
          { name: "much", type: "string" }
        ]
      }

      storage.define(schema)

      const response = storage.describe("doge")
      expect(response).to.deep.equal(schema)
    })

    it("allows creating entities of the new type", async () => {
      await steps.canCreate(testEntity1)
      await steps.canFind(testEntity1)

      await steps.canCreate(testEntity2)
      await steps.canFind(testEntity2)
    })

    it("allows updating types", async () => {
      const newSchema = {
        name: "doge",
        fields: [
          { name: "very", type: "int" },
          { name: "much", type: "int" }
        ]
      }

      storage.define(newSchema)

      const response = storage.describe("doge")
      expect(response).to.deep.equal(newSchema)
    })

    it("allows manipulating previously created entities after the type has been updated", async () => {
      const entity1 = await steps.canFind(testEntity1)
      await steps.canDelete(entity1.id)
    })

    it("doesn't count old type as valid when updating old entities", async () => {
      const entity2 = await steps.canFind(testEntity2)
      entity2.body.such = "AAAA"
      entity2.body.much = "AAAAAAAAAAAAA"
      await steps.cannotUpdate(entity2)
    })

    it("allows to update old entities to the new type", async () => {
      const entity2 = await steps.canFind(testEntity2)
      entity2.body.very = 100
      entity2.body.much = 500

      // "such" field is removed in the new type
      await steps.canUpdate({ ...entity2, body: { very: 100, much: 500 } })
    })

    it("allows creating entities of the updated type", async () => {
      await steps.canCreate(testEntityNew)
      await steps.canFind(testEntityNew)
    })
  })
}
