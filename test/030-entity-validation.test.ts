import { expect } from "chai"
import { nullLogger } from "./fixtures/null-logger"
import { CanonicalSchema } from '../src'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')

const storage = createStorage({
  schema: fixtureSchemata,
  logger: nullLogger
})

const invalidData = {
  type: 'profile.user',
  body: {
    role: 100500,
    last_name: ["Lisa"],
    first_name: false,
    company: "Alpha Oil Co",
    email: "lking@test.abc"
  }
}

const validData = {
  type: 'profile.user',
  body: {
    role: "Doge",
    last_name: "Such",
    first_name: "Much",
    company: "Alpha Oil Co",
    email: "lking@test.abc"
  }
}

describe('Entity validation', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can recognize valid entities", async () => {
    const response = await storage.validate(validData)
    expect(response.isValid).to.be.equal(true)
  })

  it("can recognize invalid entities", async () => {
    let response = await storage.validate({ type: 'profile.user', body: {} })
    expect(response.isValid).to.be.equal(false)

    response = await storage.validate(invalidData)
    expect(response.isValid).to.be.equal(false)
  })

  it("considers entities of unknown type invalid", async () => {
    let response = await storage.validate({ type: 'wow.doge', body: {} })
    expect(response.isValid).to.be.equal(false)

    response = await storage.validate({ type: 'wow.doge', body: invalidData.body })
    expect(response.isValid).to.be.equal(false)
  })

  it("can tell what is wrong with invalid entities", async () => {
    let response = await storage.validate(invalidData)
    expect(response.isValid).to.equal(false)
    expect(response.message).to.be.equal('Invalid value provided for: role, last_name, first_name')

    response = await storage.validate({ type: 'wow.doge', body: invalidData.body })
    expect(response.isValid).to.equal(false)
    expect(response.message).to.be.equal('Unknown schema: wow.doge')
  })

  it("doesn't allow saving invalid entities", () => Promise.all([
    storage.create({ id: "NOOO", type: 'profile.user', body: {} })
      .then(() => expect(true).to.equal(false, "Expected error didn't happen"))
      .catch((error) => expect(error.message).to.include("Validation failed")),
    storage.update({ id: "NOOO", type: 'profile.user', body: {}, version_id: "AAAAAAAAAAAAAAAAAAAAA" })
      .then(() => expect(true).to.equal(false, "Expected error didn't happen"))
      .catch((error) => expect(error.message).to.include("NOOO"))
  ]))
})
