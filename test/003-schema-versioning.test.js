import expect from 'expect.js'
import createStorage from '../src'
import fixtures from './fixtures/schemata/versions.json'
import createSteps from './steps/schema'
import { expectSchema } from './steps/checks'
import { forAll, forNone } from './steps/generic'

const storage = createStorage()

const { canCreate, canFind, canUpdate, cannotUpdate } = createSteps(storage)

describe("Schema versioning", () => {
  before(() => storage.init())

  it("can't update schema if it doesn't exist", cannotUpdate('version_test.user', fixtures[0]))
  it("correctly creates first version of schema", canCreate(fixtures[0]))
  it("cannot create other versions using .create()", forNone(fixtures.slice(1), canCreate))

  fixtures.slice(1).forEach((fixture, index) =>
    it(`correctly updates schema to version ${index + 2}`, canUpdate('version_test.user', fixture))
  )

  const lastVersion = fixtures[fixtures.length - 1]
  it("only the latest version is directly available", canFind(lastVersion))
  it("can't update if nothing has changed", cannotUpdate('version_test.user', lastVersion))

  it('all versions are available individually', forAll(fixtures, (fixture, index) => async () => {
    const response = await storage.getSchema('version_test.user', index + 1)
    expectSchema(response)
    expect(response.body).to.eql(fixture)
  }))
})
