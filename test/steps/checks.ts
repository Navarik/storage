import expect from 'expect.js'

export const expectEntity = (given) => {
  expect(given).to.be.an('object')
  expect(given).to.have.keys(['body', 'type', 'id', 'version_id', 'created_at', 'modified_at'])
  expect(given.body).to.be.an('object')
  expect(given.type).to.be.a('string')
  expect(given.schema).to.be.a('string')
  expect(given.id).to.be.a('string')
  expect(given.version_id).to.be.a('string')
}

// Do a simple comparison of two scalar arrays.
export const arraysAreSame = (arr1, arr2) => arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i])

// Take (obj, "a.b.c.") and return (obj.a.b.c)
export const memberFromString = (baseObj, str) => str.split('.').reduce((obj,m)=>obj[m], baseObj)

// Make an array by taking a specified member from each object in an array.
export const extractMembers = (arrayOfObjects, memberDesc) => arrayOfObjects.map(obj => memberFromString(obj, memberDesc))
