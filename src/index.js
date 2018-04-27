import 'babel-polyfill'
import { readJsonDirectory } from './adapters/filesystem'
import RedisQueueAdapter from './adapters/redis-queue'
import { schemaModel, entityModel } from './models'
import server from './ports/rest-server'

const queue = new RedisQueueAdapter({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
})

const schema = new schemaModel({ queue })
const entity = new entityModel({ queue })

const initializeSchema = () => (
  process.env.SCHEMA_SOURCE
    ? schema.create(readJsonDirectory(process.env.SCHEMA_SOURCE))
    : schema.restoreState()
)

const initializeData = () => (
  process.env.DATA_SOURCE
    ? entity.create(readJsonDirectory(process.env.DATA_SOURCE))
    : entity.restoreState()
)

// Healthchecks
server.addHealthCheck(queue.isConnected, 'Queue down')

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

queue.connect()
  .then(initializeSchema)
  .then(initializeData)
  .then(() => server.start(process.env.PORT))
