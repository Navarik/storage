import * as expect from 'expect.js'

export const expectAvroFormat = (given) => {
  expect(given.fields).to.be.an('array')
  expect(given.name).to.be.a('string')
  expect(given.type).to.be('record')
}

export const expectRecord = (given) => {
  expect(given).to.be.an('object')
  expect(given).to.have.keys(['body', 'id', 'version', 'version_id', 'created_at', 'modified_at'])
  expect(given.body).to.be.an('object')
}

export const expectSchema = (given) => {
  expectRecord(given)
  expectAvroFormat(given.body)
}

export const expectEntity = (given) => {
  expectRecord(given)
  expect(given.type).to.be.a('string')
  expectAvroFormat(given.schema)
}

// Do a simple comparison of two scalar arrays.
export const arraysAreSame = (arr1, arr2) => arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i])

// Take (obj, "a.b.c.") and return (obj.a.b.c)
export const memberFromString = (baseObj, str) => str.split('.').reduce((obj,m)=>obj[m], baseObj)

// Make an array by taking a specified member from each object in an array.
export const extractMembers = (arrayOfObjects, memberDesc) => arrayOfObjects.map(obj => memberFromString(obj, memberDesc))
