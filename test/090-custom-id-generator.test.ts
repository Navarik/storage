import { expect } from "chai"
import { v5 as uuidv5 } from "uuid"
import { Storage, CanonicalSchema } from '../src'
import { expectEntity } from './steps/checks'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')

const storage = new Storage<any, any>({
  schema: fixtureSchemata,
  logger: nullLogger,
  idGenerators: {
    "profile.user": (body: any) => uuidv5(<string>body['email'], "00000000-0000-0000-0000-000000000000")
  }
})

describe('Custom ID generator support', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("correctly generates id for entity", async () => {
    const entity = await storage.update({ type: "profile.user", body: { email: "doge" }})
    expectEntity(entity)
    expect(entity.id).to.equal("342ad644-fdd3-56c6-9614-bbaa87a0cf09")
  })

  it("doesn't produce new entities on subsequent updates", async () => {
    const entity = await storage.update({ type: "profile.user", body: { email: "doge" }})
    expectEntity(entity)
    expect(entity.id).to.equal("342ad644-fdd3-56c6-9614-bbaa87a0cf09")

    const collection = await storage.find({})
    expect(collection).to.be.an("Array")
    expect(collection).to.have.length(1)
  })
})
