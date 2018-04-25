import 'babel-polyfill'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { flatten } from './utils'
import EntityModel from './entity'
import SchemaModel from './schema'
import createServer from './server'
import Metadata from './metadata'
import * as schemaRegistry from './schema/registry'
import * as searchIndex from './adapters/search-index'
import * as changeLog from './change-log'

// Models
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const schemaModel = new SchemaModel({ rootUuid: UUID_ROOT })
const entityModel = new EntityModel({})

// Models
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const schema = new SchemaModel({ rootUuid: UUID_ROOT })
const entityModel = new EntityModel({})

// Controllers
const getNamespaces = (req, res) => schemaModel.getNamespaces(req.params)
const findSchemata = (req, res) => schemaModel.find(req.params)
const findOneSchema = (req, res) => schemaModel.findOne(req.params, req.params.version)
const getSchema = (req, res) => schemaModel.get(req.params.id)
const getSchemaVersion = (req, res) => schemaModel.getVersion(req.params.vid)
const allSchemaVersions = (req, res) => schemaModel.findAll(req.params)
const createSchema = (req, res) => schemaModel.create(req.body).then(x => { res.status(201); return x })
const updateSchema = (req, res) => schemaModel.update(req.params.id, req.body)

export const createEntity = async (body) => {
  const formatted = await entityModel.create(body)
  const response = schemaRegistry.formatEntity(formatted)
  const confirmed = await searchIndex.add(response)

  await changeLog.record(response.data)

  return response
}

export const updateEntity = async (id, body) => {
  const response = await schemaModel.format(req.body)
  response.data = await entityModel.update(req.params.id, response.data)

  return response
}

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

const readDirectory = directory => flatten(getFileNames(directory).map(readJsonFile))

// Connect to databases then start web-server
Promise
  .all([ schemaModel.connect(), entityModel.connect() ])
  .then(() => (process.env.SEED_SCHEMATA
    && schemaModel.createAll(readDirectory(process.env.SEED_SCHEMATA))
    && schemaRegistry.register(readDirectory(process.env.SEED_SCHEMATA))
  ))
  .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(createServer(controller))
