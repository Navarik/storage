import 'babel-polyfill'
import { hashField, random } from './id-generator'
import TransactionManager from './transaction'
import ChangeLog from './change-log'
import SchemaRegistry from './schema-registry'
import LocalState from './local-state'
import Observer from './observer'
import createEntityView from './view'

import createCommand from './commands/create'
import updateCommand from './commands/update'
import initCommand from './commands/init'

const configure = (config = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'
  const transactionManager = new TransactionManager()
  const trackVersions = (typeof(config.trackVersions) === 'boolean') ? config.trackVersions : true

  const schemaChangeLog = new ChangeLog({
    type: log.schema || log,
    content: config.schema ? { schema: config.schema } : undefined,
    idGenerator: hashField('name'),
    transactionManager
  })

  const entityChangeLog = new ChangeLog({
    type: log.entity || log,
    content: config.data,
    idGenerator: random(),
    transactionManager
  })

  const schemaState = new LocalState(index.schema || index, 'body.name', trackVersions)
  const entityState = new LocalState(index.entity || index, 'id', trackVersions)

  const observer = new Observer()

  const schemaRegistry = new SchemaRegistry()
  const entityView = createEntityView(schemaRegistry)

  const createSchema = createCommand(schemaChangeLog, schemaRegistry)
  const createEntity = createCommand(entityChangeLog, schemaRegistry)

  const updateSchema = updateCommand(schemaChangeLog, schemaState, schemaRegistry)
  const updateEntity = updateCommand(entityChangeLog, entityState, schemaRegistry)

  const init = initCommand(schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer)

  return {
    getSchema: (name, version) => schemaState.get(name, version),
    findSchema: (query, options = {}) => schemaState.find(query, options),
    schemaNames: () => schemaRegistry.listUserTypes(),
    createSchema: (body) => createSchema('schema', body),
    updateSchema: (name, body) => updateSchema(name, body),

    get: (id, version, options = {}) =>
      Promise.resolve(entityState.get(id, version)).then(entityView(options.view)),

    find: (query = {}, { limit, offset, sort, view } = {}) =>
      entityState.find(query, { limit, offset, sort }).then(entityView(view)),

    findContent: (text = '', { limit, offset, sort, view } = {}) =>
      entityState.findContent(text, { limit, offset, sort }).then(entityView(view)),

    count: (query = {}) => entityState.count(query),

    create: (type, body = {}, options = {}) =>
      createEntity(type, body).then(entityView(options.view)),

    update: (id, body, options = {}) =>
      updateEntity(id, body, options).then(entityView(options.view)),

    validate: (type, body) => schemaRegistry.validate(type, body),
    isValid: (type, body) => schemaRegistry.isValid(type, body),

    observe: (handler, filter = {}) => observer.listen(filter, handler),

    init,

    isConnected: () =>
      schemaChangeLog.isConnected() &&
      schemaState.isConnected() &&
      entityChangeLog.isConnected() &&
      entityState.isConnected(),

    isTrackingVersions: () => trackVersions
  }
}

export * from './local-state/find-filters'
export { default as MongoIndexAdapter } from './local-state/mongo-index-adapter'

export default configure
