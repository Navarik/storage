import expect from 'expect.js'

export const expectRecord = (given) => {
  expect(given).to.be.an('object')
  expect(given).to.have.keys(['type', 'payload', 'id', 'version', 'version_id', 'created_at', 'modified_at'])
  expect(given.payload).to.be.an('object')
}

export const expectSchema = (given) => {
  expectRecord(given)
  expect(given.type).to.be('schema')
  expect(given.payload).to.be.an('object')
  expect(given.payload.fields).to.be.an('array')
  expect(given.payload.name).to.be.a('string')
  expect(given.payload.namespace).to.be.a('string')
  expect(given.payload.description).to.be.a('string')
  expect(given.payload.type).to.be('record')
}

export const expectEntity = (schema, given) => {
  expectRecord(given)
  expect(given.type).to.be(`${schema.namespace}.${schema.name}`)
  expect(given.schema).to.be.an('object')
  expect(given.schema).to.be.eql(schema)
  expect(given.payload).to.be.an('object')
}
