import 'babel-polyfill'
import { GitDatasourceAdapter, FilesystemDatasourceAdapter } from './adapters/data-source'
import { EventEmitterQueueAdapter } from './adapters/queue'
import { NeDbSearchIndexAdapter } from './adapters/search-index'

import { schemaModel, entityModel } from './models'

const dataSources = {
  file: new FilesystemDatasourceAdapter({ format: 'json' }),
  git: new GitDatasourceAdapter({
    workingDirectory: process.env.TEMP_DIRECTORY,
    format: 'json'
  }),
}

const configure = (config) => {
  const queue = (typeof config.queue === 'function'
    ? config.queue
    : new EventEmitterQueueAdapter()
  )

  const searchIndex = (typeof config.searchIndex === 'function'
    ? config.searchIndex
    : new NeDbSearchIndexAdapter()
  )

  const schema = new schemaModel({ queue, dataSources, searchIndex })
  const entity = new entityModel({ queue, dataSources, searchIndex })

  return {
    schema,
    entity,
    connect: () => queue.connect()
  }
}
  // queue.connect()
  //   .then(() => schema.restoreState(process.env.SCHEMA_SOURCE))
  //   .then(() => entity.restoreState(process.env.DATA_SOURCE))

export default configure
