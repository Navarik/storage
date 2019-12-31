import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixtureSchemata from './fixtures/schemata/schemata.json'

const storage = createStorage({
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
    expect(response).to.be.equal('[Storage.SchemaRegistry] Invalid value provided for: role, last_name, first_name')

    response = await storage.validate('wow.such.doge!', invalidData)
    expect(response).to.be.equal('[Storage.SchemaRegistry] Unknown type: wow.such.doge!')
  })
})
