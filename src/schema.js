import uuidv5 from 'uuid/v5'
import Metadata from './metadata'
import * as schemaRegistry from './schema/registry'
import * as searchIndex from './adapters/search-index'
import * as changeLog from './change-log'

// Model
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const schemaMetadata = new Metadata({
  // Generate same ID for the same schema names
  idGenerator: body => uuidv5(`${body.namespace}.${body.name}`, UUID_ROOT)
})

// Controllers
const getNamespaces = (req, res) => schemaModel.getNamespaces(req.params)
const findSchemata = (req, res) => schemaModel.find(req.params)
const findOneSchema = (req, res) => schemaModel.findOne(req.params, req.params.version)
const getSchema = (req, res) => schemaModel.get(req.params.id)
const getSchemaVersion = (req, res) => schemaModel.getVersion(req.params.vid)
const allSchemaVersions = (req, res) => schemaModel.findAll(req.params)
const createSchema = (req, res) => schemaModel.create(req.body).then(x => { res.status(201); return x })
const updateSchema = (req, res) => schemaModel.update(req.params.id, req.body)
