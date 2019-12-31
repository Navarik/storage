import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixtures from './fixtures/schemata/schemata'
import { forAll, forNone } from './steps/generic'
import { createSteps as createSchemaSteps } from './steps/schema'

const storage = createStorage()

const { cannotCreate, canCreate, cannotFind, canFind } = createSchemaSteps(storage)

describe("Schema format", () => {
  before(() => storage.init())

  it("can't create empty schema", cannotCreate({}))
  it("allows schemata without fields and description", canCreate({ name: 'test' }))

  it("created schemata are normalized and default values are provided",
    canFind({ name: 'test', description: '', type: 'record', fields: [] })
  )
})

describe("Schema creation", () => {
  before(() => storage.init())

  it("doesn't have schemata before they are created", forAll(fixtures, cannotFind))
  it("correctly creates new schemata", forAll(fixtures, canCreate))
  it("doesn't allow duplicates", forNone(fixtures, canCreate))
  it("can find created schemata", forAll(fixtures, canFind))

  it("correct number of schemata has been created", async () => {
    const response = await storage.findSchema()
    expect(response).to.be.an('array')
    expect(response).to.have.length(fixtures.length)
  })
})
