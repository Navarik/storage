// @flow
import 'babel-polyfill'
import { GitDatasourceAdapter, FilesystemDatasourceAdapter } from './adapters/data-source'
import { EventEmitterQueueAdapter } from './adapters/queue'
import { NeDbSearchIndexAdapter } from './adapters/search-index'
import SearchIndex from './ports/search-index'
import DataSource from './ports/data-source'
import ChangeLog from './ports/change-log'

import { SchemaModel, EntityModel } from './models'
import type { AvroSchema, Identifier } from './flowtypes'

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

type ModuleConfiguration = {
  queue: ?string | { schema: string, entity: string },
  index: ?string | { schema: string, entity: string }
}

const configure = (config: ModuleConfiguration) => {
  const queue = config.queue || 'default'
  const index = config.index || 'default'

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

  const schema = new SchemaModel({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  })

  const entity = new EntityModel({
    changeLog: entityChangeLog,
    searchIndex: entitySearchIndex
  })

  return {
    getNamespaces: () => schema.getNamespaces(),
    getSchema: (name: string, version: ?string) => schema.get(name, version),
    findSchema: (params: Object) => schema.find(params),
    createSchema: (body: AvroSchema) => schema.create('schema', body),
    updateSchema: (name: string, body: AvroSchema) => schema.update(name, body),

    find: (params: Object) => entity.find(params),
    get: (id: string, version: ?string) => entity.get(id, version),
    create: (type: string, body: Object) => entity.create(type, body),
    update: (id: Identifier, body: Object) => entity.update(id, body),

    validate: (type: string, body: Object) => entity.validate(type, body),

    init: async (sources: { schemata?: string, data?: string } = {}) => {
      await Promise.all([
        schemaChangeLog.adapter.connect(),
        entityChangeLog.adapter.connect()
      ])

      const schemaSource = await dataSource.read(sources.schemata)
      const entitySource = await dataSource.read(sources.data)

      await schema.init(schemaSource)
      await entity.init(entitySource)
    }
  }
}

export default configure
