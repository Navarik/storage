// @flow
import 'babel-polyfill'
import { EventEmitterQueueAdapter } from './adapters/queue'
import { NeDbSearchIndexAdapter } from './adapters/search-index'
import SearchIndex from './ports/search-index'
import ChangeLog from './ports/change-log'

import { SchemaModel, EntityModel } from './models'
import type { AvroSchema, Identifier, ModuleConfiguration } from './flowtypes'

const createChangelogAdapter = (conf) => {
  if (conf === 'default') {
    return new EventEmitterQueueAdapter({})
  }

  if (conf instanceof Array) {
    return new EventEmitterQueueAdapter({ log: conf })
  }

  return conf
}

const configureSearchIndexAdapter = (conf) => {
  let adapter = conf
  if (conf === 'default') {
    adapter = new NeDbSearchIndexAdapter()
  }

  return adapter
}

const configure = (config: ModuleConfiguration = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'
  const namespace = config.namespace || 'storage'

  const schemaChangeLog = new ChangeLog({
    topic: `${namespace}.schema`,
    adapter: createChangelogAdapter(log.schema || log)
  })
  const entityChangeLog = new ChangeLog({
    topic: `${namespace}.entity`,
    adapter: createChangelogAdapter(log.entity || log)
  })

  const schemaSearchIndex = new SearchIndex({
    adapter: configureSearchIndexAdapter(index.schema || index)
  })
  const entitySearchIndex = new SearchIndex({
    adapter: configureSearchIndexAdapter(index.entity || index)
  })

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

    init: async () => {
      await schema.init(config.schema || [])
      await entity.init(config.data || [])
    }
  }
}

export default configure
