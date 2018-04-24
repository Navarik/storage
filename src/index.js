import 'babel-polyfill'
import logger from 'logops'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { flatten } from './utils'
import EntityModel from './entity'
import SchemaModel from './schema'
import { register as registerSchema } from './schema/registry'
import * as entityCommands from './entity/commands'
import createServer from './server'
import * as changeLog from './change-log'
import { createEntity } from './entity/commands'

changeLog.handle('create', data => entityModel.create(data))

const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const readDirectory = directory => flatten(getFileNames(directory).map(readJsonFile))

// Models
const schemaModel = new SchemaModel({ rootUuid: UUID_ROOT })
const entityModel = new EntityModel({})

// Controllers
const getNamespaces     = (req, res) => schemaModel.getNamespaces(req.params)
const findSchemata      = (req, res) => schemaModel.find(req.params)
const findOneSchema     = (req, res) => schemaModel.findOne(req.params, req.params.version)
const getSchema         = (req, res) => schemaModel.get(req.params.id)
const getSchemaVersion  = (req, res) => schemaModel.getVersion(req.params.vid)
const allSchemaVersions = (req, res) => schemaModel.findAll(req.params)
const createSchema      = (req, res) => schemaModel.create(req.body).then(x => { res.status(201); return x })
const updateSchema      = (req, res) => schemaModel.update(req.params.id, req.body)

const findEntities = async (req, res) => {
  const entities = await entityModel.find(req.params)
  const response = await schemaModel.format(entities)

  return response
}

const getEntity = async (req, res) => {
  const entity = await entityModel.findOne(req.params, req.params.v)
  const response = await schemaModel.format(entity)

  return response
}

const allEntityVersions = async (req, res) => {
  const entity = await entityModel.findAll(req.params)
  const response = await schemaModel.format(entity)

  return response
}

const updateEntity = async (req, res) => {
  const response = await schemaModel.format(req.body)
  response.data = await entityModel.update(req.params.id, response.data)

  return response
}

const controller = {
  schemaModel,
  entityModel,
  getNamespaces,
  findSchemata,
  findOneSchema,
  getSchema,
  getSchemaVersion,
  allSchemaVersions,
  createSchema,
  updateSchema,
  findEntities,
  getEntity,
  allEntityVersions,
  updateEntity,
  createEntity
}

// Connect to databases then start web-server
Promise
  .all([ schemaModel.connect(), entityModel.connect() ])
  .then(() => (process.env.SEED_SCHEMATA
    && schemaModel.createAll(readDirectory(process.env.SEED_SCHEMATA))
    && registerSchema(readDirectory(process.env.SEED_SCHEMATA))
  ))
  .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(createServer(controller))
