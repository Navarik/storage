import expect from 'expect.js'
import createStorage from '../src'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import fixtures from './fixtures/data/versions.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'

const storage = createStorage({
  schema: fixtureSchemata
})

const { canCreate, cannotCreate, cannotUpdate, canUpdate } = createSteps(storage)
let id

describe("Entity versioning", () => {
  before(() => storage
    .init()
    .then(() => storage.create('profile.user', fixtures[0]))
    .then(entity => { id = entity.id })
  )

  it("can't update nonexistent entity", cannotUpdate('wow-such-much-doge', { a: 100, b: 500 }))

  fixtures.slice(1).forEach((fixture, version) =>
    it(`correctly updates entity to version ${version + 2}`, () => canUpdate(id, fixture)())
  )

  const lastVersion = fixtures[fixtures.length - 1]
  it("only the latest version is directly available", async () => {
    let response

    response = await storage.get(id)
    expectEntity(response)
    expect(response.body).to.eql(lastVersion)
    expect(response.version).to.eql(fixtures.length)

    response = await storage.find(lastVersion)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectEntity(response[0])
    expect(response[0].body).to.eql(lastVersion)
    expect(response[0].version).to.eql(fixtures.length)
  })

  it("can't update if nothing has changed", (done) => cannotUpdate(id, lastVersion)(done))

  it('all versions are available individually', forAll(fixtures, (fixture, index) => async () => {
    const response = await storage.get(id, index + 1)
    expectEntity(response)
    expect(response.body).to.eql(fixture)
  }))
})
