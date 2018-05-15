import expect from 'expect.js'

import { expectSchema } from './checks'

const createSteps = storage => ({
  cannotCreate: (given) => done => {
    storage.schema.create(given)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canCreate: schema => async () => {
    let response

    response = await storage.schema.create(schema)
    expectSchema(response)
    expect(response.payload.name).to.be(schema.name)
    expect(response.payload.namespace).to.be(schema.namespace)
    expect(response.payload.description).to.be(schema.description || '')
    expect(response.payload.fields).to.eql(schema.fields || [])
  },

  canFind: schema => async () => {
    let response

    // Get by type name
    const typeName = `${schema.namespace}.${schema.name}`
    response = await storage.schema.get(typeName)
    expectSchema(response)
    expect(response.payload).to.eql(schema)

    // Find using name and namespace in a query
    response = await storage.schema.find({ name: schema.name, namespace: schema.namespace })
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSchema(response[0])
    expect(response[0].payload).to.eql(schema)
  },

  cannotFind: (schema) => async () => {
    let response

    // Get by type name
    const typeName = `${schema.namespace}.${schema.name}`
    response = await storage.schema.get(typeName)
    expect(response).to.be(undefined)

    // Find using name and namespace in a query
    response = await storage.schema.find({ name: schema.name, namespace: schema.namespace })
    expect(response).to.be.an('array')
    expect(response).to.have.length(0)
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
  }
})

export default createSteps
