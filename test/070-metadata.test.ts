import expect from 'expect.js'
import { Storage, CanonicalSchema, CanonicalEntity } from '../src'
import { EntitySteps } from './steps/entities'
import { expectEntity } from './steps/checks'
import { nullLogger } from "./fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('./fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity> = require('./fixtures/data/events')

const storage = new Storage({
  schema: fixtureSchemata,
  meta: {
    'wow': 'string',
    'very': 'int'
  },
  logger: nullLogger
})

const steps = new EntitySteps(storage)

describe('Metadata support', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("correctly creates entities with metadata", async () => {
    const fixtures = fixturesEvents.map(x => ({ ...x, meta: { wow: 'doge', very: 1 } }))
    await Promise.all(fixtures.map(x => steps.canCreate('doge', x)))
  })

  it("can find created entities", async () => {
    await Promise.all(fixturesEvents.map(x => steps.canFind('doge', x)))
  })

  it("can read metadata from created entities", async () => {
    const entities = await storage.find('doge')
    for (const entity of entities) {
      expectEntity(entity)
      expect(entity.meta).to.be.an('object')
      expect(entity.meta.wow).to.equal('doge')
      expect(entity.meta.very).to.equal(1)
    }
  })

  it("can create default metadata if it's not required", async () => {
    const entity = await steps.canCreate('doge', fixturesEvents[0])
    expect(entity.meta).to.be.an('object')
    expect(entity.meta.wow).to.equal(null)
    expect(entity.meta.very).to.equal(null)
  })

  it("can find entities by metadata values", async () => {
    await Promise.all(fixturesEvents.map(x => steps.canCreate('doge', x)))

    const allEntities = await storage.find('doge')
    expect(allEntities).to.be.an('array')
    expect(allEntities).to.have.length(2 * fixturesEvents.length + 1)

    const selectedEntities = await storage.find('doge', { 'meta.wow': 'doge' })
    expect(selectedEntities).to.be.an('array')
    expect(selectedEntities).to.have.length(fixturesEvents.length)
  })
})
