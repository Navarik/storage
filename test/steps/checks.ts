import { expect } from "chai"
import { CanonicalEntity } from '../../src'

export const expectEntity = (given: Partial<CanonicalEntity<any, any>>|undefined) => {
  expect(given).to.be.an('object')
  if (!given) {
    throw new Error('No entity given')
  }
  expect(given).to.have.keys(['body', 'meta', 'type', 'id', 'version_id', 'created_at', 'created_by', 'modified_at', 'modified_by', "previous_version_id", "last_action", "schema"])
  expect(given.body).to.be.an('object')
  expect(given.meta).to.be.an('object')
  expect(given.type).to.be.a('string')
  expect(given.schema).to.be.a('string')
  expect(given.id).to.be.a('string')
  expect(given.version_id).to.be.a('string')
  expect(given.created_at).to.be.a('string')
  expect(given.created_by).to.be.a('string')
  expect(given.modified_at).to.be.a('string')
  expect(given.modified_by).to.be.a('string')
  expect(given.last_action).to.be.a('string')
}

export const expectSameEntity = (given: Partial<CanonicalEntity<any, any>>|undefined, expected: Partial<CanonicalEntity<any, any>>|undefined) => {
  expectEntity(given)
  if (!given || !expected) {
    throw new Error('No entity given')
  }

  if (expected.type) {
    expect(given.type).to.eql(expected.type)
  }
  if (expected.id) {
    expect(given.id).to.eql(expected.id)
  }

  for (const field in expected.body) {
    expect(given.body[field]).to.deep.eq(expected.body[field])
  }
}
