import 'babel-polyfill'
import logger from 'logops'
import server from './adapters/http-server'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { BadRequestError, ConflictError } from './errors'
import { flatten, exclude } from './utils'
import EntityModel from './entity'
import formatEntity from './entity/format'
import SchemaModel from './schema'

const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const readDirectory = directory => flatten(getFileNames(directory).map(readJsonFile))

// Models
const schemaModel = new SchemaModel({ rootUuid: UUID_ROOT })
const entityModel = new EntityModel({}, schemaModel)

// Controllers
const getNamespaces     = (req, res) => schemaModel.getNamespaces(req.params)
const findSchemata      = (req, res) => schemaModel.find(req.params)
const findOneSchema     = (req, res) => schemaModel.findOne(req.params, req.params.version)
const getSchema         = (req, res) => schemaModel.get(req.params.id)
const getSchemaVersion  = (req, res) => schemaModel.getVersion(req.params.vid)
const allSchemaVersions = (req, res) => schemaModel.findAll(req.params)
const createSchema      = (req, res) => schemaModel.create(req.body).then(x => { res.status(201); return x })
const updateSchema      = (req, res) => schemaModel.update(req.params.id, req.body)

const findEntities      = (req, res) => entityModel.find(req.params)
const createEntity      = (req, res) => entityModel.create(req.body).then(x => { res.status(201); return x })
const updateEntity      = (req, res) => entityModel.update(req.params.id, req.body)
const getEntity         = (req, res) => entityModel.findOne(req.params.id, req.params.v)
const allEntityVersions = (req, res) => entityModel.findAll(req.params)

const castEntities = async (req, res) => {
  const entities = await entityModel.find(exclude(['castTypeId']))
  const targetSchema = await schemaModel.get(req.params.castTypeId)
  const data = entities.data.map(formatEntity(targetSchema))

  return { data, schema: [targetSchema] }
}

const castEntity = async (req, res) => {
  const entity = await entityModel.findOne(req.params.id)
  const targetSchema = await schemaModel.get(req.params.castTypeId)
  const data = formatEntity(targetSchema, entity.data)

  return { data, schema: [targetSchema] }
}

// Healthchecks
server.addHealthCheck(schemaModel.isConnected, 'Schema core down')
server.addHealthCheck(entityModel.isConnected, 'Entity core down')

// Mount business logic
// Schema lists
server.mount('get', '/schemas',                       findSchemata)
server.mount('get', '/schemata',                      findSchemata)
server.mount('get', '/schemas/namespaces',            getNamespaces)
server.mount('get', '/schemata/namespaces',           getNamespaces)
server.mount('get', '/schemas/namespace/:namespace',  findSchemata)
server.mount('get', '/schemata/namespace/:namespace', findSchemata)

// Schema ID lookups
server.mount('get', '/schema/:id',                    getSchema)
server.mount('get', '/schema/:id/versions',           allSchemaVersions)
server.mount('get', '/schema_version/:vid',           getSchemaVersion)

// Single Schema search
server.mount('get', '/schema/:namespace/:name',                  findOneSchema)
server.mount('get', '/schema/:namespace/:name/versions',         allSchemaVersions)
server.mount('get', '/schema/:namespace/:name/version/:version', findOneSchema)
server.mount('get', '/schema/:namespace/:name/v/:version',       findOneSchema)

// Schema creation/update
server.mount('post', '/schemas',               createSchema)
server.mount('post', '/schemata',              createSchema)
server.mount('put',  '/schema/:id',            updateSchema)

// Entity management
server.mount('post', '/entities',              createEntity)
server.mount('get',  '/entities',              findEntities)
server.mount('put',  '/entity/:id',            updateEntity)
server.mount('get',  '/entity/:id',            getEntity)
server.mount('get',  '/entity/:id/versions',   allEntityVersions)
server.mount('get',  '/entity/:id/version/:v', getEntity)
server.mount('get',  '/entity/:id/v/:v',       getEntity)

// Entity casting
server.mount('get',  '/entities/as/:castTypeId',   castEntities)
server.mount('get',  '/entity/:id/as/:castTypeId', castEntity)

// Connect to databases then start web-server
Promise
  .all([ schemaModel.connect(), entityModel.connect() ])
  .then(() => (process.env.SEED_SCHEMATA && schemaModel.createAll(readDirectory(process.env.SEED_SCHEMATA))))
  .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(() => server.start(process.env.PORT))
