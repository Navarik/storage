import expect from 'expect.js'
import createStorage from '../src'
import fixtures from './fixtures/schemata/schemata.json'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

export const forAll = (given, func) => () => Promise.all(given.map(x => func(x)()))

const cannotCreate = given => done => {
  storage.schema.create(given)
    .then(() => done("Expected error didn't happen"))
    .catch(() => done())
}

const expectSchema = (given, expected) =>{
  expect(given).to.be.an('object')
  expect(given.type).to.be('schema')
  expect(given.version).to.be(1)
  expect(given.payload).to.be.an('object')
  expect(given.payload).to.have.keys(['name', 'namespace', 'type', 'description', 'fields'])
  expect(given.payload).to.be.eql(expected)
}

export const canCreate = (given, expected) => async () => {
  const response = await storage.schema.create(given)
  expectSchema(response, expected || given)

  const searchResponse = await storage.schema.findLatest({ name: given.name, namespace: given.namespace })
  expect(searchResponse).to.be.an('array')
  expect(searchResponse).to.have.length(1)
  expectSchema(searchResponse[0], expected || given)
}

export const cannotFind = (schema) => async () => {
  const response = await storage.schema.findLatest({ name: schema.name, namespace: schema.namespace })
  expect(response).to.be.an('array')
  expect(response).to.be.empty()
}

export const cannotFindVersions = given => async () => {
  let response

  response = await storage.schema.findVersions({ name: given.name, namespace: given.namespace })
  expect(response).to.be.an('array')
  expect(response).to.be.empty()
}

describe("Schema format", () => {
  before(() => storage.connect())

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
  before(() => storage.connect())

  it("doesn't have schemata before they are created", forAll(fixtures, cannotFind))

  it("correctly creates new schemata", forAll(fixtures, canCreate))

  it("doesn't allow duplicates", (done) => {
    Promise.all(fixtures.map(fixture => storage.schema.create(fixture)
      .then(() => done("Expected error didn't happen"))
    )).catch(() => done())
  })

  // it("correct number of schemata has been created", async () => {
  //   const response = await storage.schema.findLatest()
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(fixtures.length)
  // })

  // it("created namespaces are visible", async function () {
  //   const response = await schema.namespaces()
  //   fixtures.forEach(fixture => expect(response).to.contain(fixture.namespace))
  // })
})
