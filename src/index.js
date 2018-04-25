import 'babel-polyfill'
import { readJsonDirectory } from './adapters/filesystem'
import webServer from './server'
import * as schema from './schema'

// Connect to databases then start web-server
Promise
  .resolve()
  .then(() => (process.env.SEED_SCHEMATA
    && schema.create(readJsonDirectory(process.env.SEED_SCHEMATA))
  ))
  // .then(() => (process.env.SEED_DATA && entityModel.create(readDirectory(process.env.SEED_DATA))))
  .then(() => webServer.start(process.env.PORT))
