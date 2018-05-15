import expect from 'expect.js'
import createStorage from '../src'
import fixtures from './fixtures/schemata/schemata.json'
import { expectSchema, createSteps } from './steps/schema'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

const { cannotCreate, canCreate, cannotFind, canFind } = createSteps(storage)

const forAll = (given, func) => () => Promise.all(given.map(x => func(x)()))

describe("Schema format", () => {
  before(() => storage.init())

  it("can't create empty schema", cannotCreate({}))

  it("can't create schema without namespace", cannotCreate(
    { name: 'test', fields: [{ name: 'test_field', type: 'string' }] }
  ))

  it("allows schemata without fields and description", canCreate(
    { name: 'test', namespace: 'test' },
    { name: 'test', namespace: 'test', description: '', type: 'record', fields: [] }
  ))
})

describe("Schema creation flow", () => {
  before(() => storage.init())

  it("doesn't have schemata before they are created", forAll(fixtures, cannotFind))

  it("correctly creates new schemata", forAll(fixtures, canCreate))

  it("doesn't allow duplicates", (done) => {
    Promise.all(fixtures.map(fixture => storage.schema.create(fixture)
      .then(() => done("Expected error didn't happen"))
    )).catch(() => done())
  })

  it("correct number of schemata has been created", async () => {
    const response = await storage.schema.findLatest()
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixtures.length)
  })

  it("can find created schemata", forAll(fixtures, canFind))

  it("created namespaces are visible", async () => {
    const response = await storage.schema.getNamespaces()
    fixtures.forEach(fixture => expect(response).to.contain(fixture.namespace))
  })
})
