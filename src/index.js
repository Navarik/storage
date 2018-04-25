import 'babel-polyfill'
import uuidv5 from 'uuid/v5'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { flatten } from './utils'
import createServer from './server'
import Metadata from './metadata'
import * as schemaRegistry from './schema-registry'
import * as controller from './entity-controller'

// Models
const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
const schemaMetadata = new Metadata({
  // Generate same ID for the same schema names
  idGenerator: body => uuidv5(`${body.namespace}.${body.name}`, UUID_ROOT),
})

const readDirectory = directory => flatten(getFileNames(directory).map(readJsonFile))

// Connect to databases then start web-server
Promise
  .resolve()
  .then(() => (process.env.SEED_SCHEMATA
    && schemaRegistry.register(readDirectory(process.env.SEED_SCHEMATA))
  ))
  // .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(createServer(controller))
