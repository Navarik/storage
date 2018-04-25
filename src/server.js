import server from './ports/rest-server'
import * as entity from './entity'
import * as schema from './schema'

// Healthchecks
server.addHealthCheck(() => true, 'Imposibiru')

// Mount business logic
// Schema lists
server.read('/schemas', schema.findLatest)
server.read('/schemata', schema.findLatest)
server.read('/schemas/namespaces', schema.getNamespaces)
server.read('/schemata/namespaces', schema.getNamespaces)
server.read('/schemas/namespace/:namespace', schema.findLatest)
server.read('/schemata/namespace/:namespace', schema.findLatest)

// Schema ID lookups
server.read('/schema/:id', schema.getLatest)
server.read('/schema/:id/versions', schema.findVersions)
server.read('/schema/:id/versions/:version', schema.getVersion)

// Single Schema search
server.read('/schema/:namespace/:name', schema.findOneLatest)
server.read('/schema/:namespace/:name/versions', schema.findVersions)
server.read('/schema/:namespace/:name/version/:version', schema.findOneVersion)
server.read('/schema/:namespace/:name/v/:version', schema.findOneVersion)

// Schema creation/update
server.create('/schemas', schema.create)
server.create('/schemata', schema.create)
server.update('/schema/:id', schema.update)

// Entity management
server.read('/entities', entity.findLatest)
server.create('/entities', entity.create)
server.read('/entity/:id', entity.getLatest)
server.update('/entity/:id', entity.update)
server.read('/entity/:id/versions', entity.findVersions)
server.read('/entity/:id/version/:version', entity.getVersion)
server.read('/entity/:id/v/:version', entity.getVersion)

export default server
