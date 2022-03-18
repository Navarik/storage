import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { expectSameEntity } from '../steps/checks'
import { EntitySteps } from '../steps/entities'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixtures: Array<CanonicalEntity<any, any>> = require('../fixtures/data/versions').default

export const entityVersioning = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)
  let id: string
  let version_id: string

  describe('Entity versioning', () => {
    before(() => storage.up())

    it("can't update nonexistent entity", async () => {
      await steps.cannotUpdate({ id: 'wow-such-much-doge', body: { a: 100, b: 500 }, version_id: 'wow-such-much-doge' })
    })

    it("can create and update entity after it's created", async () => {
      const [firstVersion, ...versions] = fixtures
      const entity = await steps.canCreate(firstVersion)
      if (undefined === entity) {
        throw new Error('No entity created')
      }

      id = entity.id
      version_id = entity.version_id

      for (const version of versions) {
        const entity = await steps.canUpdate({ id, version_id, body: version.body })
        version_id = entity.version_id
      }
    })

    it('only the latest version is directly available', async () => {
      const lastVersion = fixtures[fixtures.length - 1]
      const response = await storage.get(id)
      expectSameEntity(response, lastVersion)

      await steps.canFind(lastVersion)
    })

    it('only one version counts', async () => {
      expect(await storage.count({id})).to.equal(1)
    })

    it('can view version history using history() API', async () => {
      const response = await storage.history(id)
      expect(response).to.have.length(fixtures.length)
      // expectSameEntity(response, lastVersion)
    })

    after(() => storage.down())
  })
}
