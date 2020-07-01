import { expect } from "chai"
import { nullLogger } from "./fixtures/null-logger"
import { Storage, CanonicalSchema } from '../src'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

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
      expect(response).to.contain(schema.type)
      expect(storage.describe(schema.type)).to.equal(schema)
    })
  })

  it("allows defining new types", async () => {
    const schema = {
      type: "doge",
      fields: {
        "such": "string",
        "much": "string"
      }
    }

    storage.define(schema)

    const response = storage.describe("doge")
    expect(response).to.equal(schema)
  })

  it("allows updating types", async () => {
    const newSchema = {
      type: "doge",
      fields: {
        "very": "int",
        "much": "int"
      }
    }

    storage.define(newSchema)

    const response = storage.describe("doge")
    expect(response).to.equal(newSchema)
  })
})
