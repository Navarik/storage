import { ChangelogAdapter } from './types'
import { hashField, random } from './id-generator'
import { LocalTransactionManager } from './transaction'
import { ChangelogFactory } from './change-log'
import { AvroSchemaRegistry } from './schema/avro-schema-registry'
import { LocalState } from './local-state'
import { Observer } from './observer'
import { entityView as createEntityView } from './view'
import { createCommand } from './commands/create'
import { updateCommand } from './commands/update'
import { InitCommand } from './commands/init'

type StorageConfig = {
  changelog?: ChangelogAdapter,
  index?: object,
  schema?: any,
  data?: any
}

const configure = (config: StorageConfig = {}) => {
  const transactionManager = new LocalTransactionManager()

  const changelogFactory = new ChangelogFactory({
    transactionManager
  })

  const schemaChangeLog = changelogFactory.create({
    adapter: 'default',
    idGenerator: hashField('name'),
    content: config.schema ? { schema: config.schema } : undefined
  })
  const schemaState = new LocalState('default', 'body.name')

  const entityChangeLog = changelogFactory.create({
    adapter: config.changelog || 'default',
    content: config.data,
    idGenerator: random()
  })
  const entityState = new LocalState(config.index || 'default', 'id')

  const observer = new Observer()

  const schemaRegistry = new AvroSchemaRegistry()
  const entityView = createEntityView(schemaRegistry)

  const createSchema = createCommand(schemaChangeLog, schemaRegistry)
  const createEntity = createCommand(entityChangeLog, schemaRegistry)

  const updateSchema = updateCommand(schemaChangeLog, schemaState, schemaRegistry)
  const updateEntity = updateCommand(entityChangeLog, entityState, schemaRegistry)

  const init = new InitCommand({ schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer })

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
      entityState.isConnected()
  }
}

module.exports = configure
