import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { expectSameEntity } from './steps/checks'
import { EntitySteps } from './steps/entities'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixtures: Array<CanonicalEntity> = require('./fixtures/data/versions.json')

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

const steps = new EntitySteps(storage)
let id: string

describe('Entity versioning', () => {
  before(() => storage.up())
  after(() => storage.down())


  it("can't update nonexistent entity", async () => {
    await steps.cannotUpdate('doge', { id: 'wow-such-much-doge', body: { a: 100, b: 500 } })
  })

  it("can create and update entity after it's created", async () => {
    const [firstVersion, ...versions] = fixtures
    const entity = await steps.canCreate('doge', firstVersion)
    id = entity.id

    for (const version of versions) {
      await steps.canUpdate('doge', { id, body: version.body })
    }
  })

  it('only the latest version is directly available', async () => {
    const lastVersion = fixtures[fixtures.length - 1]
    let response

    response = await storage.get('doge', id)
    expectSameEntity(response, lastVersion)

    await steps.canFind('doge', lastVersion)
  })
})
