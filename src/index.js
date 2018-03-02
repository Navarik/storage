import 'babel-polyfill'
import * as schema from '@navarik/schema-core'
import * as entity from '@navarik/entity-core'
import server from '@navarik/http-server'
import { findSchemas, getSchema, createSchema, updateSchema } from './schema-controller'
import { createEntity, findEntities, updateEntity, getEntity } from './entity-controller'

// Healthchecks
server.addHealthCheck(schema.isConnected, 'Schema storage error')
server.addHealthCheck(entity.isConnected, 'Entity storage error')

// Mount business logic
server.mount('get',  '/namespaces',            schema.namespaces)

server.mount('post', '/schemas',               createSchema)
server.mount('post', '/schemata',              createSchema)
server.mount('get',  '/schemas',               findSchemas)
server.mount('get',  '/schemata',              findSchemas)
server.mount('put',  '/schema/:id',            updateSchema)
server.mount('get',  '/schema/:id',            getSchema)
server.mount('get',  '/schema/:id/version/:v', getSchema)
server.mount('get',  '/schema/:id/v/:v',       getSchema)

server.mount('post', '/entities',              createEntity)
server.mount('get',  '/entities',              findEntities)
server.mount('put',  '/entity/:id',            updateEntity)
server.mount('get',  '/entity/:id',            getEntity)
server.mount('get',  '/entity/:id/version/:v', getEntity)
server.mount('get',  '/entity/:id/v/:v',       getEntity)

// Connect to databases then start web-server
Promise
  .all([
    schema.connect({ location: process.env.DATA_LOCATION }),
    entity.connect({ location: process.env.DATA_LOCATION })
  ])
  .then(() => server.start(process.env.PORT))
