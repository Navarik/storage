import expect from 'expect.js'
import { CanonicalEntity } from '../../src'

export const expectEntity = (given: Partial<CanonicalEntity<any, any>>|undefined) => {
  expect(given).to.be.an('object')
  if (undefined === given) {
    throw new Error('No entity given')
  }
  expect(given).to.have.keys(['body', 'meta', 'type', 'id', 'version_id', 'created_at', 'modified_at'])
  expect(given.body).to.be.an('object')
  expect(given.meta).to.be.an('object')
  expect(given.type).to.be.a('string')
  expect(given.schema).to.be.a('string')
  expect(given.id).to.be.a('string')
  expect(given.version_id).to.be.a('string')
}

export const expectSameEntity = (given: Partial<CanonicalEntity<any, any>>|undefined, expected: Partial<CanonicalEntity<any, any>>) => {
  expectEntity(given)
  if (undefined === given) {
    throw new Error('No entity given')
  }
  expect(given.body).to.eql(expected.body)
  if (expected.type) {
    expect(given.type).to.eql(expected.type)
  }
  if (expected.id) {
    expect(given.id).to.eql(expected.id)
  }
}
