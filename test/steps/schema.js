import * as expect from 'expect.js'

import { expectSchema } from './checks'

export const createSteps = storage => ({
  cannotCreate: (given) => done => {
    storage.createSchema(given)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canCreate: schema => async () => {
    let response

    response = await storage.createSchema(schema)
    expectSchema(response)
    expect(response.version).to.be(1)
    expect(response.body.name).to.be(schema.name)
    expect(response.body.description).to.be(schema.description || '')
    expect(response.body.fields).to.eql(schema.fields || [])
  },

  canFind: schema => async () => {
    let response

    // Get by type name
    response = await storage.getSchema(schema.name)
    expectSchema(response)
    expect(response.body).to.eql(schema)

    // Find using name and namespace in a query
    response = await storage.findSchema({ name: schema.name })
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSchema(response[0])
    expect(response[0].body).to.eql(schema)
  },

  cannotFind: (schema) => async () => {
    let response

    // Get by type name
    response = await storage.getSchema(schema.name)
    expect(response).to.be(undefined)

    // Find using name and namespace in a query
    response = await storage.findSchema({ name: schema.name })
    expect(response).to.be.an('array')
    expect(response).to.have.length(0)
  },

  cannotUpdate: (typeName, schema) => done => {
    storage.updateSchema(typeName, schema)
      .then(() => done("Expected error didn't happen"))
      .catch(() => done())
  },

  canUpdate: (typeName, schema) => async () => {
    const previous = await storage.getSchema(typeName)
    expectSchema(previous)

    const response = await storage.updateSchema(typeName, schema)
    expectSchema(response)
    expect(response.body).to.eql(schema)
    expect(response.version).to.be(previous.version + 1)
  }
})
