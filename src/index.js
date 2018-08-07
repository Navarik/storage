import { hashField, random } from './id-generator'
import TransactionManager from './transaction'
import ChangeLog from './change-log'
import SchemaRegistry from './schema-registry'
import LocalState from './local-state'
import createEntityView from './view'

import SchemaModel from './commands/schema'
import EntityModel from './commands/entity'

const configure = (config = {}) => {
  const log = config.log || 'default'
  const index = config.index || 'default'
  const transactionManager = new TransactionManager()

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

  const schemaState = new LocalState(index.schema || index, 'body.name')
  const entityState = new LocalState(index.entity || index, 'id')

  const schemaRegistry = new SchemaRegistry()
  const entityView = createEntityView(schemaRegistry)

  const schemaCommands = new SchemaModel(schemaChangeLog, schemaState, schemaRegistry)
  const entityCommands = new EntityModel(entityChangeLog, entityState, schemaRegistry)

  return {
    getSchema: (name, version) => Promise.resolve(schemaState.get(name, version)),
    findSchema: (query, options = {}) => schemaState.find(query, options),
    schemaNames: () => schemaRegistry.listUserTypes(),
    createSchema: (body) => schemaCommands.create(body),
    updateSchema: (name, body) => schemaCommands.update(name, body),

    get: (id, version, options = {}) =>
      Promise.resolve(entityState.get(id, version)).then(entityView(options.view)),

    find: (query = {}, { limit, offset, view } = {}) =>
      entityState.find(query, { limit, offset }).then(entityView(view)),

    findContent: (text = '', { limit, offset, view } = {}) =>
      entityState.findContent(text, { limit, offset }).then(entityView(view)),

    count: (query = {}) => entityState.count(query),

    create: (type, body = {}, options = {}) => (
      body instanceof Array
        ? Promise.all(body.map(x => entityCommands.create(type, x)))
        : entityCommands.create(type, body)).then(entityView(options.view)),
    update: (id, body, options = {}) =>
      entityCommands.update(id, body).then(entityView(options.view)),

    validate: (type, body) => schemaRegistry.validate(type, body),
    isValid: (type, body) => schemaRegistry.isValid(type, body),

    init: async () => {
      await schemaCommands.init()
      await entityCommands.init()
    },

    isConnected: () =>
      schemaChangeLog.isConnected() &&
      schemaState.isConnected() &&
      entityChangeLog.isConnected() &&
      entityState.isConnected()
  }
}

export default configure
