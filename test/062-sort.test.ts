import expect from 'expect.js'
import { Storage } from '../src'
import { expectEntity } from './steps/checks'

const fixtureSchemata = require('./fixtures/schemata')
const fixturesEvents = require('./fixtures/data/events.json')
const fixturesTasks = require('./fixtures/data/data-entry-tasks.json')
const fixturesJobs = require('./fixtures/data/job-orders.json')
const fixturesUsers = require('./fixtures/data/users.json')
const fixturesMessages = require('./fixtures/data/messages.json')

const fixtureData = [
  ...fixturesEvents,
  ...fixturesJobs,
  ...fixturesUsers,
  ...fixturesMessages,
  ...fixturesTasks
]

const storage = new Storage({
  schema: fixtureSchemata,
  data: fixtureData
})

describe('Sorting of search results', () => {
  before(() => storage.up())
  after(() => storage.down())

  it("can perform ascending sorting on top-level field", async () => {
    const response = await storage.find({ type: 'profile.user' }, { sort: 'first_name' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)
    expect(response.map(x => x.body.first_name)).to.eql([ 'Fraser', 'King', 'Manning' ])
  })

  it("can perform descending sorting on top-level field", async () => {
    const response = await storage.find({ type: 'profile.user' }, { sort: 'first_name:desc' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)
    expect(response.map(x => x.body.first_name)).to.eql([ 'Manning', 'King', 'Fraser' ])
  })

  it("can sort when target is a subfield", async () => {
    const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'summary.fileName:desc' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    expect(response.map(x => x.body.summary['vefInspReportId'])).to.eql([ 6, 1, 5, 4 ])
  })

  it("can sort when some fields are missing", async () => {
    const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'summary.vessels:desc' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    const propertyOrder = response.map(x => x.body.summary['vefInspReportId'])
    expect(propertyOrder.slice(0, 2)).to.eql([ 5, 6 ])
  })

  it("can sort by subfield when higher field is missing", async () => {
    // Some data have no contract.
    const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'summary.contract.cargos:desc' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    const propertyOrder = response.map(x => x.body.summary['vefInspReportId'])
    expect(propertyOrder.slice(0, 4)).to.eql([ 5, 4, 6, 1])
  })

  it("will correctly sort when there are fields and subfields with identical identifiers and the subfield is the intended target", async () => {
    const response = await storage.find({ type: 'dataEntry.task' }, { sort: 'summary.contract.vessels:desc' })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    // Check that summary.contract.vessels was found rather than summary.vessels.
    expect(response[3]['body']['summary']['contract']['vessels'][0]).to.equal('HMS summary.contract.vessels')

    const propertyOrder = response.map(x => x.body.summary['vefInspReportId'])
    expect(propertyOrder.slice(0, 4)).to.eql([ 1, 5, 4, 6])
  })

  it("can sort and subsort", async () => {
    const response = await storage.find({ type: 'dataEntry.task' }, { sort: ['summary.fileFormat', 'summary.fileName'] })
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    expect(response.map(x => x.body.summary['fileName'])).to.eql([
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
      { sort: ['summary.producedBy:desc', 'summary.assignedUserId:asc'] }
    )
    expect(response).to.be.an('array')
    response.forEach(expectEntity)

    expect(response.map(x => x.body.summary['vefInspReportId'])).to.eql([ 1, 6, 5, 4 ])
  })
})
