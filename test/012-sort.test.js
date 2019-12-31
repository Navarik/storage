import * as expect from 'expect.js'
import * as createStorage from '../src'
import * as fixtureSchemata from './fixtures/schemata/schemata.json'
import * as fixturesEvents from './fixtures/data/events.json'
import * as fixturesTasks from './fixtures/data/data-entry-tasks.json'
import * as fixturesJobs from './fixtures/data/job-orders.json'
import * as fixturesUsers from './fixtures/data/users.json'
import * as fixturesMessages from './fixtures/data/messages.json'
import { expectEntity, extractMembers, arraysAreSame } from './steps/checks'

const storage = createStorage({
  schema: fixtureSchemata,
  data: {
    'timelog.timelog_event': fixturesEvents,
    'document.job_order': fixturesJobs,
    'profile.user': fixturesUsers,
    'dataEntry.task': fixturesTasks,
    'chat.text_message': fixturesMessages
  }
})

describe('Sorting of search results', () => {
  before(() => storage.init())

  // Test that the simplest form of sorting works.
  it("can perform ascending sorting on top-level field", async () => {
    const testSort = 'first_name'
    const searchLimitations = {type: 'profile.user'}
    const inspectProperty = 'body.first_name'
    const correctPropertyOrder = [ 'Fraser', 'King', 'Manning' ]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)

    expect(arraysAreSame(propertyOrder, correctPropertyOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting in reverse works.
  it("can perform descending sorting on top-level field", async () => {
    const testSort = 'first_name:desc'
    const searchLimitations = {type: 'profile.user'}
    const inspectProperty = 'body.first_name'
    const correctPropertyOrder = [ 'Manning', 'King', 'Fraser' ]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertyOrder, correctPropertyOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting for subfields works.
  it("can sort when target is a subfield", async () => {
    const testSort = 'summary.fileName:desc'
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.vefInspReportId'
    const correctPropertyOrder = [ 6, 3, 2, 1, 5, 4 ]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertyOrder, correctPropertyOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting works when some fields are missing from test data.
  it("can sort when some fields are missing", async () => {
    const testSort = 'summary.vessels:desc'
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.vefInspReportId'
    const correctPropertySubOrder = [ 5, 6, 3]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)
    const propertySubOrder = propertyOrder.slice(0, correctPropertySubOrder.length)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertySubOrder, correctPropertySubOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting works when trying to read a subfield of a null field.
  it("can sort by subfield when higher field is missing", async () => {
    const testSort = 'summary.contract.cargos:desc'  // Some data have no contract.
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.vefInspReportId'
    const correctPropertySubOrder = [ 5, 4, 6, 1]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)
    const propertySubOrder = propertyOrder.slice(0, correctPropertySubOrder.length)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertySubOrder, correctPropertySubOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting will work correctly when there are fields and subfields with identical identifiers and the subfield is the intended target.
  it("will correctly sort for a subfield despite matching higher field", async () => {
    const testSort = 'summary.contract.vessels:desc'
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.vefInspReportId'
    const correctPropertySubOrder = [ 1, 5, 4, 6]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)
    const propertySubOrder = propertyOrder.slice(0, correctPropertySubOrder.length)

    // Check that summary.contract.vessels was found rather than summary.vessels.
    expect(response[3]['body']['summary']['contract']['vessels'][0]).to.equal('HMS summary.contract.vessels')

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertySubOrder, correctPropertySubOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting and subsorting by two fields works
  it("can sort and subsort", async () => {
    const testSort = ['summary.fileFormat', 'summary.fileName']
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.fileName'
    const correctPropertyOrder = [ 'message_330564.html',
    '599934_CBC_23_3525030_DISCHARGE_WARREN_EHC_45_06-05-18.pdf',
    '600109_LIN126025BPAM06-58Summary18-18-06-03182.pdf',
    'CCIC_Singapore_Pte_Ltd.pdf',
    'Inspectorate.pdf',
    'LAN6497CHEV04-79OperationalReports18-27-18-0727.pdf' ]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertyOrder, correctPropertyOrder)).to.be.ok()
    response.forEach(expectEntity)
  })

  // Test that sorting works with the following conditions in combination:
  //    Referring to subfields (ie, summary.vessel rather than just summary).
  //    Sorting by a field and sub-sorting by a secondary field.
  //    Some fields for sorting are not present in all test data.
  it("can sort and subsort when some fields are missing", async () => {
    const testSort = ['summary.producedBy:desc', 'summary.assignedUserId:asc']
    const searchLimitations = {type: 'dataEntry.task'}
    const inspectProperty = 'body.summary.vefInspReportId'
    const correctPropertyOrder = [ 1, 2, 3, 6, 5, 4 ]

    const response = await storage.find(searchLimitations, { sort: testSort})
    const propertyOrder = extractMembers(response, inspectProperty)

    expect(response).to.be.an('array')
    expect(arraysAreSame(propertyOrder, correctPropertyOrder)).to.be.ok()
    response.forEach(expectEntity)
  })
})
