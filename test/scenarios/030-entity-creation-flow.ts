import { expect } from "chai"
import { StorageInterface, StorageConfig } from "../../src"
import { nullLogger } from "../mocks/null-logger"
import { EntitySteps } from "../steps/entity"
import { SearchSteps } from "../steps/search"

const fixtures = [
  {
    type: "timelog.event",
    body: {
      event_type: "vessel_arrived",
      sender: 2,
      job_order: 13,
      timestamp: new Date("2018-01-22T12:30:00.000Z")
    }
  },
  {
    type: "timelog.event",
    body: {
      event_type: "nor_tendered",
      sender: 1,
      job_order: 13,
      timestamp: new Date("2018-01-22T21:30:00.000Z")
    }
  },
  {
    type: "timelog.event",
    body: {
      event_type: "nor_accepted",
      sender: 2,
      job_order: 13,
      timestamp: new Date("2018-01-22T23:30:00.000Z")
    }
  },
  {
    type: "timelog.event",
    body: {
      event_type: "hoses_connected",
      sender: 3,
      job_order: 13,
      timestamp: new Date("2018-01-12T21:29:00.000Z")
    }
  },
  {
    type: "timelog.event",
    body: {
      event_type: "commenced_loading",
      sender: 1,
      job_order: 13,
      timestamp: new Date("2018-01-22T21:30:00.000Z")
    }
  }
]

export const entityCreationFlow = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: [{
      name: "timelog.event",
      fields: [
        { name: "event_type", type: "string"   },
        { name: "sender",     type: "int"      },
        { name: "timestamp",  type: "datetime" },
        { name: "job_order",  type: "int"      }
      ]
    }],
    logger: nullLogger
  })

  const dataSteps = new EntitySteps(storage)
  const searchSteps = new SearchSteps(storage)

  describe('Entity creation flow', () => {
    before(() => storage.up())

    it("doesn't have entities before they are created", async () => {
      expect(await storage.find()).to.be.an("array").to.be.empty
      expect(await storage.count()).to.equal(0)
    })

    it("correctly creates new entities", async () => {
      await Promise.all(fixtures.map(x => dataSteps.canCreate(x)))
    })

    it("can find created entities", async () => {
      expect(await storage.count()).to.equal(fixtures.length)
      await searchSteps.canFind({})
    })

    it("allows duplicates", async () => {
      await Promise.all(fixtures.map(x => dataSteps.canCreate(x)))
    })

    it("correct number of entities is created", async () => {
      expect(await storage.count()).to.equal(fixtures.length * 2)
      expect(await storage.find()).to.have.length(fixtures.length * 2)
    })

    after(() => storage.down())
  })
}
