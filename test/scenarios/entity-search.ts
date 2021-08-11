import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { expectEntity } from '../steps/checks'
import { EntitySteps } from '../steps/entities'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users').default
const fixturesMessages: Array<CanonicalEntity<any, any>> = require('../fixtures/data/messages').default

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages
]

export const entitySearch = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: fixtureData,
    logger: nullLogger
  })

  const steps = new EntitySteps(storage)

  describe('Entity search', () => {
    before(() => storage.up())
    after(() => storage.down())

    it("can't get non-existing entities", async () => {
      const response = await storage.get('nope')
      expect(response).to.be.undefined
    })

    it("can find by complete bodies: timelog events", async () => {
      await Promise.all(fixtureData.map(x => steps.canFind(x)))
    })

    it("can find entities by type", async () => {
      const response = await storage.find({ type: 'timelog.timelog_event' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(fixturesEvents.length)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
      })
    })

    it("can find entities by one field", async () => {
      const response = await storage.find({ 'body.sender': 1 })
      expect(response).to.be.an('array')
      expect(response).to.have.length(6)
      response.forEach(expectEntity)
    })

    it("can find entities by combination of fields", async () => {
      let response = await storage.find({ 'body.sender': 1, 'body.job_order': 13 })
      expect(response).to.be.an('array')
      expect(response).to.have.length(5)
      response.forEach(expectEntity)
    })

    it("can find entities by type and combination of fields", async () => {
      let response = await storage.find({ 'body.sender': 1, 'body.job_order': 13, 'type': 'timelog.timelog_event' })
      expect(response).to.be.an('array')
      expect(response).to.have.length(2)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
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
      expect(response).to.be.an('array')
      expect(response).to.have.length(3)
      response.forEach(entity => {
        expectEntity(entity)
        expect(entity.type).to.equal('timelog.timelog_event')
      })
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
  })
}
