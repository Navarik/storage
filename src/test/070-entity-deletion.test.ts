import { Storage, CanonicalSchema } from '..'
import { nullLogger } from "./fixtures/null-logger"
import { EntitySteps } from './steps/entities'

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')

const storage = new Storage({
  schema: fixtureSchemata,
  logger: nullLogger
})

const steps = new EntitySteps(storage)

describe('Entity deletion', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can delete entity", async () => {
    const testData = { type: "profile.user", body: { email: "doge" }}

    const { id } = await steps.canCreate(testData)
    await steps.canFind(testData)

    await steps.canDelete(id)
    await steps.cannotFind(testData)
  })
})
