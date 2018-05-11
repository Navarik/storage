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

export const canCreate = (given, expected) => async () => {
  const response = await storage.schema.create(given)
  expect(response).to.be.an('object')
  expect(response.type).to.be('schema')
  expect(response.version).to.be(1)
  expect(response.payload).to.be.an('object')
  expect(response.payload).to.be.eql(expected || given)
}

export const cannotFind = given => async () => {
  let response

  response = await storage.schema.findLatest({ name: given.name, namespace: given.namespace })
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
    Promise.all(fixtures.map(fixture => schema.create(fixture)
      .then(() => done("Expected error didn't happen"))
    )).catch(() => done())
  })

  // it("has only one schema with given name and namespace", forAll(fixtures, canFindOnlyOne))

  // it("correct number of schemata has been created", async function () {
  //   const response = await schema.find()
  //   expect(response).to.be.an('array')
  //   expect(response).to.have.length(fixtures.length)
  // })

  // it("created namespaces are visible", async function () {
  //   const response = await schema.namespaces()
  //   fixtures.forEach(fixture => expect(response).to.contain(fixture.namespace))
  // })
})
