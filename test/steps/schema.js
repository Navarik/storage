import expect from 'expect.js'

export const expectSchema = (given, expected) => {
  expect(given).to.be.an('object')
  expect(given.type).to.be('schema')
  expect(given.payload).to.be.an('object')
  expect(given.payload).to.have.keys(['name', 'namespace', 'type', 'description', 'fields'])
  expect(given.payload).to.be.eql(expected)
}

export const createSteps = storage => ({
  cannotCreate: (given) => done => {
    storage.schema.create(given)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canCreate: (given, expected) => async () => {
    const response = await storage.schema.create(given)
    expectSchema(response, expected || given)

    const searchResponse = await storage.schema.findLatest({ name: given.name, namespace: given.namespace })
    expect(searchResponse).to.be.an('array')
    expect(searchResponse).to.have.length(1)
    expect(searchResponse[0].version).to.be(1)
    expectSchema(searchResponse[0], expected || given)
  },

  cannotUpdate: (given) => done => {
    storage.schema.findLatest({ name: given.name, namespace: given.namespace })
      .then(searchResponse => searchResponse[0].id)
      .then(id => storage.schema.update(id, given))
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canUpdate: (given) => async () => {
    const searchResponse = await storage.schema.findLatest({ name: given.name, namespace: given.namespace })
    expect(searchResponse).to.be.an('array')
    expect(searchResponse).to.have.length(1)
    const id = searchResponse[0].id

    const response = await storage.schema.update(id, given)
    expectSchema(response, given)
    expect(response.version).to.be(searchResponse[0].version + 1)
  },

  cannotFind: (schema) => async () => {
    const response = await storage.schema.findLatest({ name: schema.name, namespace: schema.namespace })
    expect(response).to.be.an('array')
    expect(response).to.be.empty()
  },

  canFind: (schema) => async () => {
    const response = await storage.schema.findLatest({ name: schema.name, namespace: schema.namespace })
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSchema(response[0], schema)
  }
})
