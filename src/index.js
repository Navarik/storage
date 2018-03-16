import 'babel-polyfill'
import server from './adapters/http-server'
import * as entityModel from './models/entity'
import * as schemaModel from './models/schema'
import { findSchemas, getSchema, createSchema, updateSchema, getNamespaces } from './schema-controller'
import { createEntity, findEntities, updateEntity, getEntity } from './entity-controller'

// Healthchecks
server.addHealthCheck(schemaModel.isConnected, 'Schema core down')
server.addHealthCheck(entityModel.isConnected, 'Entity core down')

// Mount business logic
server.mount('get',  '/namespaces',            getNamespaces)

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
    schemaModel.connect({ location: process.env.DATA_LOCATION }),
    entityModel.connect({ location: process.env.DATA_LOCATION })
  ])
  .then(() => server.start(process.env.PORT))
