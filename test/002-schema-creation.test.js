import expect from 'expect.js'
import createStorage from '../src'
import fixtures from './fixtures/schemata/schemata.json'
import { forAll, forNone } from './steps/generic'
import createSchemaSteps from './steps/schema'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

const { cannotCreate, canCreate, cannotFind, canFind } = createSchemaSteps(storage)

describe("Schema format", () => {
  before(() => storage.init())

  it("can't create empty schema", cannotCreate({}))
  it("can't create schema without namespace", cannotCreate({
    name: 'test',
    fields: [{ name: 'test_field', type: 'string' }]
  }))
  it("allows schemata without fields and description", canCreate({
    name: 'test',
    namespace: 'test'
  }))

  it("created schemata are normalized and default values are provided",
    canFind({ name: 'test', namespace: 'test', description: '', type: 'record', fields: [] })
  )
})

describe("Schema namespaces", () => {
  before(() => storage.init())

  const dogeWow = { namespace: 'doge', name: 'wow', fields: [{ name: 'test_field', type: 'string' }] }
  const suchWow = { namespace: 'such', name: 'wow' }

  it("can have same names in different namespaces", forAll([dogeWow, suchWow], canCreate))
  it("can't have duplicate names in the same namespace", forNone([dogeWow, suchWow], canCreate))
})

describe("Schema creation", () => {
  before(() => storage.init())

  it("doesn't have schemata before they are created", forAll(fixtures, cannotFind))
  it("correctly creates new schemata", forAll(fixtures, canCreate))
  it("doesn't allow duplicates", forNone(fixtures, canCreate))
  it("can find created schemata", forAll(fixtures, canFind))

  it("correct number of schemata has been created", async () => {
    const response = await storage.schema.find()
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixtures.length)
  })

  it("created namespaces are visible", async () => {
    const response = await storage.schema.getNamespaces()
    fixtures.forEach(fixture => expect(response).to.contain(fixture.namespace))
  })
})
