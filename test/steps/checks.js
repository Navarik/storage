import expect from 'expect.js'

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
