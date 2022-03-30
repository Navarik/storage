import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { EntitySteps } from '../steps/entity'
import { nullLogger } from "../mocks/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixtures: Array<CanonicalEntity<any, any>> = require('../fixtures/data/versions').default

export const dataLoss = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)
  let id: string
  let version_id: string
  let outdatedVersionId: string

  describe('Prevent entity data loss', () => {
    before(() => storage.up())

    it("can create but can't update without version id provided", async () => {
      const firstVersion = fixtures[0]
      const entity = await steps.canCreate(firstVersion)
      if (undefined === entity) {
        throw new Error('No entity created')
      }

      id = entity.id
      version_id = entity.version_id
      outdatedVersionId = entity.version_id

      const secondVersion = fixtures[1]
      await steps.cannotUpdate({ id, body: secondVersion.body, version_id: "AAAAAAAAAAAAAAAAAAAAAA" })
    })

    it("can update with up-to-date version id", async () => {
      const versions = fixtures.slice(1, fixtures.length - 1)
      for (const version of versions) {
        const entity = await steps.canUpdate({ id, version_id, body: version.body })
        version_id = entity.version_id
      }
    })

    it('cannot update with an outdated version id', async () => {
      const lastVersion = fixtures[fixtures.length - 1]
      await steps.cannotUpdate({ id, version_id: outdatedVersionId, body: lastVersion.body })
    })

    after(() => storage.down())
  })
}
