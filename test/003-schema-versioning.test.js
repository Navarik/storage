import expect from 'expect.js'
import createStorage from '../src'
import fixtures from './fixtures/schemata/versions.json'
import { expectSchema, createSteps } from './steps/schema'

const storage = createStorage({
  queue: 'default',
  index: 'default'
})

const { canCreate, canFind, canUpdate, cannotUpdate } = createSteps(storage)

const forAll = (given, func) => () => Promise.all(given.map(x => func(x)()))

describe("Schema versioning", () => {
  before(() => storage.init())

  it("can't update schema if it doesn't exist", (done) => {
    storage.schema.update('not-even-a-valid-id', fixtures[0])
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  })

  it("correctly creates first version of schema", canCreate(fixtures[0]))

  fixtures.slice(1).forEach((version, index) =>
    it(`correctly updates schema to version ${index + 2}`, canUpdate(version))
  )

  const lastVersion = fixtures[fixtures.length - 1]
  it("only the latest version is available for a given name and namespace", canFind(lastVersion))

  it("can't update if nothing has changed", cannotUpdate(lastVersion))

  it('specific fixtures are available individually', async () => {
    const searchResponse = await storage.schema.findLatest({ name: lastVersion.name, namespace: lastVersion.namespace })
    const id = searchResponse[0].id

    const responses = await Promise.all(fixtures.map(
      (fixture, version) => storage.schema.getVersion(id, version + 1)
    ))

    responses.forEach((response, version) => expectSchema(response, fixtures[version]))
  })
})
