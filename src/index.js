import 'babel-polyfill'
import { GitDatasourceAdapter, FilesystemDatasourceAdapter } from './adapters/data-source'
import { EventEmitterQueueAdapter } from './adapters/queue'
import { NeDbSearchIndexAdapter } from './adapters/search-index'
import SearchIndex from './ports/search-index'
import DataSource from './ports/data-source'
import ChangeLog from './ports/change-log'

import { schemaModel, entityModel } from './models'

const dataSource = new DataSource({
  adapters: {
    file: new FilesystemDatasourceAdapter({ format: 'json' }),
    git: new GitDatasourceAdapter({
      workingDirectory: process.env.TEMP_DIRECTORY,
      format: 'json'
    })
  }
})

const createChangelogAdapter = (conf) => (conf === 'default'
  ? new EventEmitterQueueAdapter()
  : conf
)

const configureSearchIndex = (conf) => {
  let adapter = conf
  if (conf === 'default') {
    adapter = new NeDbSearchIndexAdapter()
  }

  return new SearchIndex({ adapter })
}

const configure = ({ queue = 'default', index = 'default' }) => {
  const schemaChangeLog = new ChangeLog({
    topic: 'schema',
    adapter: createChangelogAdapter(queue.schema || queue)
  })
  const entityChangeLog = new ChangeLog({
    topic: 'entity',
    adapter: createChangelogAdapter(queue.entity || queue)
  })

  const schemaSearchIndex = configureSearchIndex(index.schema || index)
  const entitySearchIndex = configureSearchIndex(index.entity || index)

  const schema = new schemaModel({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex,
    dataSource
  })

  const entity = new entityModel({
    changeLog: entityChangeLog,
    searchIndex: entitySearchIndex,
    dataSource
  })

  return {
    schema,
    entity,
    init: async () => {
      await Promise.all([
        schemaChangeLog.adapter.connect(),
        entityChangeLog.adapter.connect()
      ])

      await schema.init()
      await entity.init()
    }
  }
}

export default configure
