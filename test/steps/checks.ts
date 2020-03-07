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

export const expectSameEntity = (given, expected) => {
  expectEntity(given)
  expect(given.body).to.eql(expected.body)
  if (expected.type) {
    expect(given.type).to.eql(expected.type)
  }
  if (expected.id) {
    expect(given.id).to.eql(expected.id)
  }
}
