import expect from 'expect.js'
import { Storage } from '../src'

const fixtureSchemata = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata
})

const invalidData = {
  role: 100500,
  last_name: ["Lisa"],
  first_name: false,
  company: "Alpha Oil Co",
  email: "lking@test.abc"
}

const validData = {
  role: "Doge",
  last_name: "Such",
  first_name: "Much",
  company: "Alpha Oil Co",
  email: "lking@test.abc"
}

describe('Entity validation, index type', () => {
  before(() => storage.init())

  it("can recognize valid entities", async () => {
    const response = await storage.isValid('profile.user', validData)
    expect(response).to.be.equal(true)
  })

  it("can recognize invalid entities", async () => {
    const response = await storage.isValid('profile.user', invalidData)
    expect(response).to.be.equal(false)
  })

  it("can tell what is wrong with invalid entities", async () => {
    let response = await storage.validate('profile.user', invalidData)
    expect(response.isValid).to.be(false)
    expect(response.message).to.be.equal('Invalid value provided for: role, last_name, first_name')

    response = await storage.validate('wow.such.doge!', invalidData)
    expect(response.isValid).to.be(false)
    expect(response.message).to.be.equal('Unknown schema: wow.such.doge!')
  })
})
