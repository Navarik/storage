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

const configureChangeLog = (conf) => (conf === 'default'
  ? new EventEmitterQueueAdapter()
  : conf
)

const configureSearchIndex = (conf) => (conf === 'default'
  ? new NeDbSearchIndexAdapter()
  : conf
)

const configure = ({ queue = 'default', index = 'default' }) => {
  const schemaQueue = configureChangeLog(queue.schema || queue)
  const entityQueue = configureChangeLog(queue.entity || queue)

  const schemaSearchIndex = configureSearchIndex(index.schema || index)
  const entitySearchIndex = configureSearchIndex(index.entity || index)

  const schema = new schemaModel({
    queue: schemaQueue,
    searchIndex: schemaSearchIndex,
    dataSources,
  })

  const entity = new entityModel({
    queue: entityQueue,
    searchIndex: entitySearchIndex,
    dataSources,
  })

  return {
    schema,
    entity,
    connect: () => Promise.all([entityQueue.connect(), schemaQueue.connect()])
  }
}
  // queue.connect()
  //   .then(() => schema.restoreState(process.env.SCHEMA_SOURCE))
  //   .then(() => entity.restoreState(process.env.DATA_SOURCE))

export default configure
