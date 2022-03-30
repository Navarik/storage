import { expect } from "chai"
import { StorageInterface, StorageConfig } from "../../src"
import { expectSameEntity } from "../steps/checks"
import { EntitySteps } from "../steps/entity"
import { nullLogger } from "../mocks/null-logger"

const versions = [
  {
    type: "profile.user",
    body: {
      role: "Scheduler",
      first_name: "The",
      last_name: "Doge",
      company: "Alpha Oil Co",
      email: "tking100500@test.abc"
    }
  },
  {
    type: "profile.user",
    body: {
      role: "Scheduler",
      first_name: "The",
      last_name: "King",
      company: "Alpha Oil Co",
      email: "tking100500@test.abc"
    }
  },
  {
    type: "profile.user",
    body: {
      role: "Scheduler",
      first_name: "The",
      last_name: "King",
      company: "Alpha Oil Co",
      email: "tking@test.abc"
    }
  },
  {
    type: "profile.user",
    body: {
      role: "Manager",
      first_name: "The",
      last_name: "King",
      company: "Alpha Oil Co",
      email: "tking@test.abc"
    }
  }
]

export const entityVersioning = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: [{
      name: "profile.user",
      fields: [
        { name: "email", type: "string", required: true },
        { name: "role", type: "string" },
        { name: "company", type: "string" },
        { name: "last_name", type: "string" },
        { name: "first_name", type: "string" }
      ]
    }],
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)
  let testEntity

  describe('Entity updates and versioning', () => {
    before(() => storage.up())

    it("can't update nonexistent entity", async () => {
      const error = await steps.cannotUpdate({
        id: "wow-such-much-doge",
        body: { a: 100, b: 500 },
        version_id: "wow-such-much-doge"
      })
      expect(error.name).to.equal("ValidationError")
      expect(error.message).to.contain("wow-such-much-doge")
    })

    it("can create and update entity after it's created", async () => {
      const [firstVersion, ...updates] = versions
      testEntity = await steps.canCreate(firstVersion)

      for (const version of updates) {
        testEntity = await steps.canUpdate({
          id: testEntity.id,
          version_id: testEntity.version_id,
          body: version.body
        })
      }
    })

    it("only the latest version is directly available", async () => {
      const lastVersion = versions[versions.length - 1]
      const response = await storage.get(testEntity.id)
      expectSameEntity(response, lastVersion)

      const [response2] = await storage.find({ id: testEntity.id })
      expectSameEntity(response2, lastVersion)
    })

    it("only one version counts", async () => {
      expect(await storage.count({ id: testEntity.id })).to.equal(1)
    })

    it("can view version history using history() API", async () => {
      const history = await storage.history(testEntity.id)
      expect(history).to.have.length(versions.length)

      for (let i = 0; i < history.length; i++) {
        expectSameEntity(history[i], versions[versions.length - 1 - i])
      }
    })

    it("can't update with outdated version ID", async () => {
      const error = await steps.cannotUpdate({
        id: testEntity.id,
        body: { role: "Memetic translator" },
        version_id: testEntity.previous_version_id
      })
      expect(error.name).to.equal("ConflictError")
      expect(error.message)
        .to.contain(testEntity.previous_version_id)
        .to.contain(testEntity.id)
    })

    after(() => storage.down())
  })
}
