import expect from 'expect.js'
import { convertSortQueriesToPairs } from '../src/utils'
import createStorage from '../src'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import fixturesEvents from './fixtures/data/events.json'
import fixturesTasks from './fixtures/data/data-entry-tasks.json'
import fixturesJobs from './fixtures/data/job-orders.json'
import fixturesUsers from './fixtures/data/users.json'
import fixturesMessages from './fixtures/data/messages.json'
import { expectEntity } from './steps/checks'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    data: {
      'timelog.timelog_event': fixturesEvents,
      'document.job_order': fixturesJobs,
      'profile.user': fixturesUsers,
      'dataEntry.task': fixturesTasks,
      'chat.text_message': fixturesMessages
    },
    ...config,
  })


  /* 
  Helper Functions For Unit Tests
  */

  // Do a simple comparison of two scalar arrays.
  const arraysAreSame = (arr1, arr2) => arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i])

  // Take (obj, "a.b.c.") and return (obj.a.b.c)
  const memberFromString = (baseObj, str) => str.split('.').reduce((obj,m)=>obj[m], baseObj)

  // Make an array by taking a specified member from each object in an array.
  const extractMembers = (arrayOfObjects, memberDesc) => arrayOfObjects.map(obj => memberFromString(obj, memberDesc))


  /* 
  Unit Tests
  */

  describe(`Sorting of search results, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())
    after(() => {
      if (config.index.cleanup) {
        return config.index.cleanup()
      }
    })

    // Test that helper function can handle a non-array.
    it("can convert single query to array of one pair", async () => {
      const pairArray = convertSortQueriesToPairs('vessels')
      expect(pairArray).to.be.an('array')
      expect(pairArray).to.have.length(1)
      expect(pairArray[0]).to.be.an('array')
      expect(pairArray[0]).to.have.length(2)
      expect(pairArray[0][0]).to.be('vessels')
      expect(pairArray[0][1]).to.be(1)
    })

    // Test that helper function can handle an array of query strings.
    it("can convert multiple queries to array of pairs", async () => {
      const pairArray = convertSortQueriesToPairs(['hoses', 'captains', 'things'])
      expect(pairArray).to.be.an('array')
      expect(pairArray).to.have.length(3)
      expect(pairArray[0]).to.be.an('array')
      expect(pairArray.every(arr => arr.length === 2)).to.be.ok()
    })

    // Test that helper function can handle an array of query strings with sorting commands and will correctly format them to NeDB format (example: :desc becomes -1).
    it("can convert sorting queries to NeDB format", async () => {
      const pairArray = convertSortQueriesToPairs(['hoses:asc', 'captains:desc'])
      expect(pairArray).to.be.an('array')
      expect(pairArray).to.have.length(2)
      expect(pairArray[0]).to.be.an('array')
      expect(pairArray.every(arr => arr.length === 2)).to.be.ok()
      expect(pairArray[0][0]).to.be('hoses')
      expect(pairArray[0][1]).to.be(1)
      expect(pairArray[1][0]).to.be('captains')
      expect(pairArray[1][1]).to.be(-1)
    })

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
}

generateConfig().forEach(c => run(c))
