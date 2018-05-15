import expect from 'expect.js'
import exclude from 'poly-exclude'
import * as entity from '../src'

export const forAll = (givens, func) => async function () {
  return await Promise.all(givens.map(x => func(x)()))
}

export const isEmpty = () => async function () {
  const response = await entity.find({})
  expect(response).to.be.an('array')
  expect(response).to.be.empty()
}

export const canFindOnlyOne = given => async function () {
  let response

  response = await entity.find(given)
  expect(response).to.be.an('array')
  expect(response).to.have.length(1)
  expect(response[0].id).to.be.a('number')
  expect(response[0].version).to.be.a('number')
  expect(exclude(['id'], response[0])).to.be.eql(exclude(['id'], given))
}

export const canGet = given => async function () {
  let response

  response = await entity.get(given.id)
  expect(response).to.be.an('object')
  expect(response.id).to.be.a('number')
  expect(response.version).to.be.a('number')
  expect(response).to.be.eql(given)
}

export const canGetVersion = given => async function () {
  let response

  response = await entity.get(given.id, given.version)
  expect(response).to.be.an('object')
  expect(response.id).to.be.a('number')
  expect(response.version).to.be.a('number')
  expect(response).to.be.eql(given)
}

export const canCreate = (given, expected) => async function () {
  const response = await entity.create(given)
  expect(response).to.be.an('object')
  expect(response.id).to.be.a('number')
  expect(response.version).to.be.a('number')
  expect(response.version).to.eql(1)
  if (expected) {
    expect(response).to.be.eql(expected)
  } else {
    expect(exclude(['id'], response)).to.be.eql(exclude(['id'], given))
  }
}

export const cannotCreate = given => (done) => {
  entity.create(given)
    .then(() => done("Expected error didn't happen"))
    .catch(() => done())
}

export const canUpdate = given => async function () {
  const response = await entity.update(given.id, given)
  expect(response).to.be.an('object')
  expect(response).to.be.eql(given)
}

export const cannotUpdate = given => (done) => {
  entity.update(given)
    .then(() => done("Expected error didn't happen"))
    .catch(() => done())
}
