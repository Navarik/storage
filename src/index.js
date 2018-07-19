// @flow
import createChangelogAdapter from './changelog-adapter-factory'
import createSearchIndex from './search-index-factory'

import { SchemaModel, EntityModel } from './models'
import schemaRegistry from './models/schema-registry'
import type { AvroSchema, Identifier, ModuleConfiguration } from './flowtypes'

const configure = (config: ModuleConfiguration = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'

  const schemaChangeLog = config.schema
    ? createChangelogAdapter({ schema: config.schema })
    : createChangelogAdapter(log.schema || log)

  const entityChangeLog = config.data
    ? createChangelogAdapter(config.data)
    : createChangelogAdapter(log.entity || log)

  const schemaSearchIndex = createSearchIndex(index.schema || index)
  const entitySearchIndex = createSearchIndex(index.entity || index)

  const schema = new SchemaModel({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  })

  const entity = new EntityModel({
    changeLog: entityChangeLog,
    searchIndex: entitySearchIndex
  })

  return {
    getSchema: (name: string, version: ?string) => schema.get(name, version),
    findSchema: (params: Object) => schema.find(params),
    schemaNames: () => schemaRegistry.listUserTypes(),
    createSchema: (body: AvroSchema) => schema.create('schema', body),
    updateSchema: (name: string, body: AvroSchema) => schema.update(name, body),

    find: (params: Object) => entity.find(params),
    findData: (params: Object) => entity.findData(params),
    count: (params: Object) => entity.findData(params).then(xs => xs.length),

    get: (id: string, version: ?string) => entity.get(id, version),
    create: (type: string, body: Object | Array<Object>) => (
      body instanceof Array
        ? entity.createCollection(type, body)
        : entity.create(type, body)
    ),
    update: (id: Identifier, body: Object) => entity.update(id, body),

    validate: (type: string, body: Object) => entity.validate(type, body),
    isValid: (type: string, body: Object) => entity.isValid(type, body),

    init: async () => {
      await schema.init()
      await entity.init()
    }
  }
}

export default configure
