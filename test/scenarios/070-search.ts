import { expect } from "chai"
import { StorageInterface, StorageConfig } from '../../src'
import { expectEntity } from '../checks'
import { nullLogger } from "../mocks/null-logger"
import fixtureSchemata from '../fixtures/schemata.json'
import fixturesEvents from "../fixtures/data/events"
import fixturesJobs from "../fixtures/data/job-orders"
import fixturesUsers from "../fixtures/data/users"
import fixturesMessages from "../fixtures/data/messages"

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages
]

export const search = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    logger: nullLogger
  })

  describe('Entity search', () => {
    before(async () => {
      await storage.up()
      await Promise.all(fixtureData.map(x => storage.create<any>(x)))
    })

    it("can find entities by type", async () => {
      const response = await storage.find({ type: 'timelog.timelog_event' })
      expect(response).to.be.an('array').to.have.length(fixturesEvents.length)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
      })
    })

    it("can find entities by one field", async () => {
      const response = await storage.find({ 'body.sender': 1 })
      expect(response).to.be.an('array').to.have.length(6)
      response.forEach(expectEntity)
    })

    it("can find entities by combination of fields", async () => {
      let response = await storage.find({ 'body.sender': 1, 'body.job_order': 13 })
      expect(response).to.be.an('array').to.have.length(5)
      response.forEach(expectEntity)
    })

    it("can find entities by type and combination of fields", async () => {
      let response = await storage.find<any>({
        'body.sender': 1,
        'body.job_order': 13,
        'type': 'timelog.timelog_event'
      })

      expect(response).to.be.an('array').to.have.length(2)

      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
        expect(entity.body['job_order']).to.equal(13)
        expect(entity.body['sender']).to.equal(1)
      })
    })

    it("can use logical 'and' and 'or' operators", async () => {
      let response = await storage.find({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "or", args: [
            { operator: "eq", args: ["body.sender", 1] },
            { operator: "eq", args: ["body.sender", 3] }
          ]}
        ]
      })
      expect(response).to.be.an('array').to.have.length(3)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
      })
    })

    it("automatically converts string filter values to their respective schema types", async () => {
      let response = await storage.find({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "eq", args: ["body.sender", '3'] },
          { operator: "eq", args: ["body.timestamp", "2018-01-12T21:29:00.000Z"] }
        ]
      })
      expect(response).to.be.an('array').to.have.length(1)
      response.forEach(expectEntity)
    })

    it("can use comparison operators", async () => {
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "gt", args: ["body.sender", 1] }
        ]
      })).to.equal(3)
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "lt", args: ["body.sender", 2] }
        ]
      })).to.equal(2)
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "gte", args: ["body.sender", 1] }
        ]
      })).to.equal(5)
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "lte", args: ["body.sender", 2] }
        ]
      })).to.equal(4)
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "neq", args: ["body.sender", 1] },
          { operator: "neq", args: ["body.sender", 2] }
        ]
      })).to.equal(1)
    })

    it("can use in() operator to search for one value from an array of values", async () => {
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "in", args: ["body.sender", [1, 3]] }
        ]
      })).to.equal(3)
      expect(await storage.count({
        operator: "and",
        args: [
          { operator: "eq", args: ["type", "timelog.timelog_event"] },
          { operator: "in", args: ["body.sender", [1, 2, 3]] }
        ]
      })).to.equal(5)
    })

    it("can use regex to find entities", async () => {
      expect(await storage.count(
        { operator: "like", args: ["body.mot_name", "9230084"] }
      )).to.equal(1)
      expect(await storage.count(
        { operator: "like", args: ["body.mot_name", "^Tanker.*"] }
      )).to.equal(2)
      expect(await storage.count(
        { operator: "like", args: ["body.mot_name", ".*"] }
      )).to.equal(3)
    })

    it("can't find what's not there", async () => {
      const response = await storage.find({ 'body.sender': '100500' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(0)
    })

    it("can hydrate found entities", async () => {
      const response = await storage.find({ 'body.sender': 1 }, { hydrate: true })
      expect(response).to.be.an('array')
      expect(response).to.have.length(6)
      response.forEach(expectEntity)
    })

    after(() => storage.down())
  })
}
