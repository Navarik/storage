// @flow
import { createChangelogAdapter } from './adapters/change-log'
import { createSearchIndexAdapter } from './adapters/search-index'
import { InMemoryStateAdapter } from './adapters/local-state'
import { hashField, random } from './adapters/id-generator'
import ChangeLog from './change-log'
import SchemaRegistry from './schema-registry'
import SearchIndex from './search-index'

import SchemaModel from './schema'
import EntityModel from './entity'
import type { AvroSchema, Identifier, ModuleConfiguration } from './flowtypes'

const configure = (config: ModuleConfiguration = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'

  const schemaChangeLogAdapter = config.schema
    ? createChangelogAdapter({ schema: config.schema })
    : createChangelogAdapter(log.schema || log)

  const entityChangeLogAdapter = config.data
    ? createChangelogAdapter(config.data)
    : createChangelogAdapter(log.entity || log)

  const schemaSearchIndexAdapter = createSearchIndexAdapter(
    index.schema || index
  )

  const entitySearchIndexAdapter = createSearchIndexAdapter(
    index.entity || index
  )

  const schemaRegistry = new SchemaRegistry()

  const schema = new SchemaModel({
    changeLog: new ChangeLog(schemaChangeLogAdapter, hashField('name')),
    searchIndex: new SearchIndex(schemaSearchIndexAdapter),
    state: new InMemoryStateAdapter(),
    schemaRegistry
  })

  const entity = new EntityModel({
    changeLog: new ChangeLog(entityChangeLogAdapter, random()),
    searchIndex: new SearchIndex(entitySearchIndexAdapter),
    state: new InMemoryStateAdapter(),
    schemaRegistry
  })

  return {
    getSchema: (name: string, version: ?string) => schema.get(name, version),
    findSchema: (params: Object) => schema.find(params),
    schemaNames: () => schema.listTypes(),
    createSchema: (body: AvroSchema) => schema.create(body),
    updateSchema: (name: string, body: AvroSchema) => schema.update(name, body),

    find: (params: Object, limit: ?number, skip: ?number) => entity.find(params, limit, skip),
    findData: (params: Object, limit: ?number, skip: ?number) => entity.findData(params, limit, skip),
    count: (params: Object) => entity.findData(params).then(xs => xs.length),

    get: (id: string, version: ?string) => entity.get(id, version),
    create: (type: string, body: Object | Array<Object>) => (
      body instanceof Array
        ? Promise.all(body.map(x => entity.create(type, x)))
        : entity.create(type, body)
    ),
    update: (id: Identifier, body: Object) => entity.update(id, body),

    validate: (type: string, body: Object) => entity.validate(type, body),
    isValid: (type: string, body: Object) => entity.isValid(type, body),

    init: async () => {
      await Promise.all([
        schemaChangeLogAdapter.init(),
        entityChangeLogAdapter.init()
      ])

      await schema.init()
      await entity.init()
    },

    isConnected: () =>
      schemaChangeLogAdapter.isConnected() &&
      schemaSearchIndexAdapter.isConnected() &&
      entityChangeLogAdapter.isConnected() &&
      entitySearchIndexAdapter.isConnected()
  }
}

export default configure
