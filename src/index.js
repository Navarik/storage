// @flow
import 'babel-polyfill'
import createChangelogAdapter from './changelog-adapter-factory'
import createSearchIndex from './search-index-factory'

import { SchemaModel, EntityModel } from './models'
import type { AvroSchema, Identifier, ModuleConfiguration } from './flowtypes'

const configure = (config: ModuleConfiguration = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'
  const namespace = config.namespace || 'storage'

  const schemaChangeLog = createChangelogAdapter(log.schema || log, namespace)
  const entityChangeLog = createChangelogAdapter(log.entity || log, namespace)

  const schemaSearchIndex = createSearchIndex(index.schema || index)
  const entitySearchIndex = createSearchIndex(index.entity || index)

  const schema = new SchemaModel({
    namespace,
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
