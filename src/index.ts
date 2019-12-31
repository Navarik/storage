import { StringMap } from '@navarik/types'
import { ChangelogAdapter, EntityId, EntityBody } from './types'
import { hashField, random } from './id-generator'
import { LocalTransactionManager } from './transaction'
import { ChangelogFactory } from './change-log'
import { AvroSchemaRegistry } from './schema/avro-schema-registry'
import { LocalState } from './local-state'
import { Observer } from './observer'
import { entityView as createEntityView } from './view'
import { CreateCommand } from './commands/create'
import { UpdateCommand } from './commands/update'
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

  const createEntity = new CreateCommand({ changeLog: entityChangeLog, schema: schemaRegistry })
  const updateEntity = new UpdateCommand({ changeLog: entityChangeLog, state: entityState, schema: schemaRegistry })

  const init = new InitCommand({ schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer })

  return {
    types: () => schemaRegistry.listUserTypes(),
    getSchema: (name: string, version?: number) => schemaState.get(name, version),

    get: (id: EntityId, version: number, options = { view: 'canonical' }) =>
      Promise.resolve(entityState.get(id, version)).then(entityView(options.view)),

    find: (query = {}, { limit, offset, sort, view } = { limit: null, offset: 0, sort: null, view: 'canonical' }) =>
      entityState.find(query, { limit, offset, sort }).then(entityView(view)),

    findContent: (text = '', { limit, offset, sort, view } = { limit: null, offset: 0, sort: null, view: 'canonical' }) =>
      entityState.findContent(text, { limit, offset, sort }).then(entityView(view)),

    count: (query = {}) => entityState.count(query),

    create: (type: string, body: EntityBody = {}, options = { view: 'canonical' }) =>
      createEntity.run({ type, body }).then(entityView(options.view)),

    update: (id: EntityId, body: EntityBody, type = '', options = { view: 'canonical' }) =>
      updateEntity.run({ id, body, type }).then(entityView(options.view)),

    validate: (type, body) => schemaRegistry.validate(type, body),
    isValid: (type, body) => schemaRegistry.isValid(type, body),

    observe: (handler, filter = {}) => observer.listen(filter, handler),

    init: () => init.run(),

    isConnected: () =>
      schemaChangeLog.isConnected() &&
      schemaState.isConnected() &&
      entityChangeLog.isConnected() &&
      entityState.isConnected()
  }
}

module.exports = configure
