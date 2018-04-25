import server from './ports/rest-server'
import * as entity from './entity'

// Healthchecks
server.addHealthCheck(() => true, 'Imposibiru')

// Mount business logic
// Schema lists
// server.mount('get', '/schemas',                       controller.findSchemata)
// server.mount('get', '/schemata',                      controller.findSchemata)
// server.mount('get', '/schemas/namespaces',            controller.getNamespaces)
// server.mount('get', '/schemata/namespaces',           controller.getNamespaces)
// server.mount('get', '/schemas/namespace/:namespace',  controller.findSchemata)
// server.mount('get', '/schemata/namespace/:namespace', controller.findSchemata)

// // Schema ID lookups
// server.mount('get', '/schema/:id',                    controller.getSchema)
// server.mount('get', '/schema/:id/versions',           controller.allSchemaVersions)
// server.mount('get', '/schema_version/:vid',           controller.getSchemaVersion)

// // Single Schema search
// server.mount('get', '/schema/:namespace/:name',                  controller.findOneSchema)
// server.mount('get', '/schema/:namespace/:name/versions',         controller.allSchemaVersions)
// server.mount('get', '/schema/:namespace/:name/version/:version', controller.findOneSchema)
// server.mount('get', '/schema/:namespace/:name/v/:version',       controller.findOneSchema)

// // Schema creation/update
// server.mount('post', '/schemas',               controller.createSchema)
// server.mount('post', '/schemata',              controller.createSchema)
// server.mount('put',  '/schema/:id',            controller.updateSchema)

// Entity management
server.mountRead('/entities', entity.findLatest)
server.mountCreate('/entities', entity.create)
server.mountRead('/entity/:id', entity.getLatest)
server.mountUpdate('/entity/:id', entity.update)
server.mountRead('/entity/:id/versions', entity.findVersions)
server.mountRead('/entity/:id/version/:version', entity.getVersion)
server.mountRead('/entity/:id/v/:version', entity.getVersion)

export default server
