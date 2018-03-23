import 'babel-polyfill'
import logger from 'logops'
import server from './adapters/http-server'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { BadRequestError, ConflictError } from './errors'
import EntityModel from './model/entity'
import SchemaModel from './model/schema'

const importData = (model, directory) => model.createAll(getFileNames(directory).map(readJsonFile))

// Models
const schemaModel = new SchemaModel()
const entityModel = new EntityModel({}, schemaModel)

// Controllers
const getNamespaces = (req, res) => schemaModel.getNamespaces(req.params)
const findSchemas   = (req, res) => schemaModel.find(req.params)
const createSchema  = (req, res) => schemaModel.create(req.body).then(x => { res.status(201); return x })
const updateSchema  = (req, res) => schemaModel.update(req.params.id, req.body)
const getSchema     = (req, res) => schemaModel.findOne(req.params.id, req.params.v)

const findEntities  = (req, res) => entityModel.find(req.params)
const createEntity  = (req, res) => entityModel.create(req.body).then(x => { res.status(201); return x })
const updateEntity  = (req, res) => entityModel.update(req.params.id, req.body)
const getEntity     = (req, res) => entityModel.findOne(req.params.id, req.params.v)

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
  .all([ schemaModel.connect(), entityModel.connect() ])
  .then(() => (process.env.SEED_SCHEMATA && importData(schemaModel, process.env.SEED_SCHEMATA)))
  .then(() => (process.env.SEED_DATA && importData(schemaModel, process.env.SEED_DATA)))
  .then(() => server.start(process.env.PORT))
