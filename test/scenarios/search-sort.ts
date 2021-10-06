import { expect } from "chai"
import { StorageInterface, CanonicalSchema, CanonicalEntity, StorageConfig } from '../../src'
import { expectEntity } from '../steps/checks'
import { nullLogger } from "../fixtures/null-logger"

const fixtureSchemata: Array<CanonicalSchema> = require('../fixtures/schemata')
const fixturesEvents: Array<CanonicalEntity<any, any>> = require('../fixtures/data/events').default
const fixturesTasks: Array<CanonicalEntity<any, any>> = require('../fixtures/data/data-entry-tasks').default
const fixturesJobs: Array<CanonicalEntity<any, any>> = require('../fixtures/data/job-orders').default
const fixturesUsers: Array<CanonicalEntity<any, any>> = require('../fixtures/data/users').default
const fixturesMessages: Array<CanonicalEntity<any, any>> = require('../fixtures/data/messages').default

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages,
  ...fixturesTasks
]

export const searchSort = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: fixtureData,
    logger: nullLogger
  })

  describe('Sorting of search results', () => {
    before(() => storage.up())

    it("can perform ascending sorting on top-level field", async () => {
      const response = await storage.find({ type: 'profile.user' }, { sort: 'body.first_name' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)
      expect(response.map((x: any) => x.body.first_name)).to.eql([ 'Fraser', 'King', 'Manning' ])
    })

    it("can perform descending sorting on top-level field", async () => {
      const response = await storage.find({ type: 'profile.user' }, { sort: 'body.first_name:desc' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)
      expect(response.map((x: any) => x.body.first_name)).to.eql([ 'Manning', 'King', 'Fraser' ])
    })

    it("can sort when target is a subfield", async () => {
      const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'body.summary.fileName:desc' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      expect(response.map((x: any) => x.body.summary['vefInspReportId'])).to.eql([ 6, 1, 5, 4 ])
    })

    it("can sort when some fields are missing", async () => {
      const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'body.summary.vessels:desc' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      const propertyOrder = response.map((x: any) => x.body.summary['vefInspReportId'])
      expect(propertyOrder.slice(0, 2)).to.eql([ 5, 6 ])
    })

    it("can sort by subfield when higher field is missing", async () => {
      // Some data have no contract.
      const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'body.summary.contract.cargos:desc' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      const propertyOrder = response.map((x: any) => x.body.summary['vefInspReportId'])
      expect(propertyOrder.slice(0, 4)).to.eql([ 5, 4, 6, 1])
    })

    it("will correctly sort when there are fields and sub-fields with identical identifiers and the subfield is the intended target", async () => {
      const response: any = await storage.find({ type: 'dataEntry.task' }, { sort: 'body.summary.contract.vessels:desc' })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      // Check that summary.contract.vessels was found rather than summary.vessels.
      expect(response[3]['body']['summary']['contract']['vessels'][0]).to.equal('HMS summary.contract.vessels')

      const propertyOrder = response.map((x: any) => x.body.summary['vefInspReportId'])
      expect(propertyOrder.slice(0, 4)).to.eql([ 1, 5, 4, 6])
    })

    it("can sort and sub-sort", async () => {
      const response = await storage.find({ type: 'dataEntry.task' }, { sort: ['body.summary.fileFormat', 'body.summary.fileName'] })
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      expect(response.map((x: any) => x.body.summary['fileName'])).to.eql([
        'message_330564.html',
        '599934_CBC_23_3525030_DISCHARGE_WARREN_EHC_45_06-05-18.pdf',
        '600109_LIN126025BPAM06-58Summary18-18-06-03182.pdf',
        'CCIC_Singapore_Pte_Ltd.pdf'
      ])
    })

    // Test that sorting works with the following conditions in combination:
    //    Referring to subfields (ie, summary.vessel rather than just summary).
    //    Sorting by a field and sub-sorting by a secondary field.
    //    Some fields for sorting are not present in all test data.
    it("can sort and subsort when some fields are missing", async () => {
      const response = await storage.find(
        { type: 'dataEntry.task' },
        { sort: ['body.summary.producedBy:desc', 'body.summary.assignedUserId:asc'] }
      )
      expect(response).to.be.an('array')
      response.forEach(expectEntity)

      expect(response.map((x: any) => x.body.summary['vefInspReportId'])).to.eql([ 1, 6, 5, 4 ])
    })

    after(() => storage.down())
  })
}
