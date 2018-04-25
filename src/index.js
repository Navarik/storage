import 'babel-polyfill'
import { getFileNames, readJsonFile } from './adapters/filesystem'
import { flatten } from './utils'
import webServer from './server'
import * as schemaRegistry from './ports/schema-registry'

const readDirectory = directory => flatten(getFileNames(directory).map(readJsonFile))

// Connect to databases then start web-server
Promise
  .resolve()
  .then(() => (process.env.SEED_SCHEMATA
    && schemaRegistry.add(readDirectory(process.env.SEED_SCHEMATA))
  ))
  // .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(() => webServer.start(process.env.PORT))
