import expect from 'expect.js'

export const expectRecord = (given) => {
  expect(given).to.be.an('object')
  expect(given).to.have.keys(['type', 'body', 'id', 'version', 'version_id', 'created_at', 'modified_at'])
  expect(given.body).to.be.an('object')
}

export const expectSchema = (given) => {
  expectRecord(given)
  expect(given.type).to.be('schema')
  expect(given.body.fields).to.be.an('array')
  expect(given.body.name).to.be.a('string')
  expect(given.body.namespace).to.be.a('string')
  expect(given.body.description).to.be.a('string')
  expect(given.body.type).to.be('record')
}

export const expectEntity = (given) => {
  expectRecord(given)
}
