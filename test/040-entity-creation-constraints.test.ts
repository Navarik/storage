import { Storage, CanonicalSchema } from '../src'
import { EntitySteps } from './steps/entities'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata
})

const steps = new EntitySteps(storage)

describe('Entity format and constraints', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can't create entity of unknown type", async () => {
    await steps.cannotCreate({ type: 'wow.doge', body: {} })
  })

  it("can't create malformed entity", async () => {
    await steps.cannotCreate({
      type: 'profile.user',
      body: {}
    })

    await steps.cannotCreate({
      type: 'profile.user',
      body: {
        role: 100500,
        last_name: ["Lisa"],
        first_name: false,
        company: "Alpha Oil Co",
        email: "lking@test.abc"
      }
    })
  })

  it("can create properly structured entity", async () => {
    await steps.canCreate({
      type: 'profile.user',
      body: {
        role: "Doge",
        last_name: "Such",
        first_name: "Much",
        company: "Alpha Oil Co",
        email: "lking@test.abc"
      }
    })
  })
})
