// @flow
import 'babel-polyfill'
import map from 'poly-map'
import createChangelogAdapter from './changelog-adapter-factory'
import createSearchIndex from './search-index-factory'

import { SchemaModel, EntityModel } from './models'
import type { AvroSchema, Identifier, ModuleConfiguration } from './flowtypes'

const prependKeys = (prefix, xs) => {
  const result = {}
  const keys = Object.keys(xs)

  for (let i = 0; i < keys.length; i++) {
    result[`${prefix}.${keys[i]}`] = xs[keys[i]]
  }

  return result
}

const configure = (config: ModuleConfiguration = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'
  const namespace = config.namespace || 'storage'

  const schemaChangeLog = config.schema
    ? createChangelogAdapter(prependKeys(namespace, { schema: config.schema }))
    : createChangelogAdapter(log.schema || log)

  const entityChangeLog = config.data
    ? createChangelogAdapter(prependKeys(namespace, config.data))
    : createChangelogAdapter(log.entity || log)

  const schemaSearchIndex = createSearchIndex(index.schema || index)
  const entitySearchIndex = createSearchIndex(index.entity || index)

  const schema = new SchemaModel({
    namespace,
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  })

  const entity = new EntityModel({
    namespace,
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
      await schema.init()
      await entity.init()
    }
  }
}

export default configure
