// @flow
import { createChangelogAdapter } from './adapters/change-log'
import { createSearchIndexAdapter } from './adapters/search-index'
import { hashField, random } from './adapters/id-generator'
import ChangeLog from './change-log'
import SchemaRegistry from './schema-registry'
import LocalState from './local-state'
import createEntityView from './view'

import SchemaModel from './commands/schema'
import EntityModel from './commands/entity'

const configure = (config = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'

  const schemaChangeLogAdapter = config.schema
    ? createChangelogAdapter({ schema: config.schema })
    : createChangelogAdapter(log.schema || log)
  const schemaChangeLog = new ChangeLog(schemaChangeLogAdapter, hashField('name'))

  const entityChangeLogAdapter = config.data
    ? createChangelogAdapter(config.data)
    : createChangelogAdapter(log.entity || log)
  const entityChangeLog = new ChangeLog(entityChangeLogAdapter, random())

  const schemaState = new LocalState(
    createSearchIndexAdapter(index.schema || index),
    'body.name'
  )

  const entityState = new LocalState(
    createSearchIndexAdapter(index.entity || index),
    'id'
  )

  const schemaRegistry = new SchemaRegistry()
  const entityView = createEntityView(schemaRegistry)

  const schema = new SchemaModel(schemaChangeLog, schemaState, schemaRegistry)
  const entity = new EntityModel(entityChangeLog, entityState, schemaRegistry)

  return {
    getSchema: (name, version) => Promise.resolve(schemaState.get(name, version)),
    findSchema: (query, parameters = {}) => schemaState.find(query, parameters),
    schemaNames: () => schemaRegistry.listUserTypes(),
    createSchema: (body) => schema.create(body),
    updateSchema: (name, body) => schema.update(name, body),

    get: (id, version, options = {}) =>
      Promise.resolve(entityState.get(id, version)).then(entityView(options.view)),
    find: (query = {}, parameters = {}, options = {}) =>
      entityState.find(query, parameters).then(entityView(options.view)),
    count: (query = {}) => entityState.count(query),

    create: (type, body = {}, options = {}) => (
      body instanceof Array
        ? Promise.all(body.map(x => entity.create(type, x)))
        : entity.create(type, body)).then(entityView(options.view)),
    update: (id, body, options = {}) =>
      entity.update(id, body).then(entityView(options.view)),

    validate: (type, body) => schemaRegistry.validate(type, body),
    isValid: (type, body) => schemaRegistry.isValid(type, body),

    init: async () => {
      await schema.init()
      await entity.init()
    },

    isConnected: () =>
      schemaChangeLog.isConnected() &&
      schemaState.isConnected() &&
      entityChangeLog.isConnected() &&
      entityState.isConnected()
  }
}

export default configure
