import { diff } from 'deep-object-diff'
import { isConnected, configure, close } from '../adapters/db'
import { head, errorWhen, splitName, empty } from '../utils'
import * as model from './model'
import { formatCollection, formatObject } from './format'

export const get = (id, version) => model
  .search({
    id,
    is_deleted: 0,
    ...(version ? { version } : { is_latest: 1 })
  })
  .then(formatCollection)
  .then(head)

export const find = (params = {}) => model
  .search({ ...params, is_deleted: 0, is_latest: 1 })
  .then(formatCollection)

export const create = body => Promise.resolve()
  .then(errorWhen(() => body.id, `Can not set new entity id to ${body.id}`))
  .then(() => model.create(body))
  .then(formatObject)

export const update = (id, body) => get(id)
  .then(errorWhen(x => !x, `Id ${id} does not exist`))
  .then(errorWhen(old => empty(diff(old, body)), 'Versions are identical'))
  .then(model.deprecate)
  .then(({ version, type }) => model.createVersion({
    ...body,
    id,
    type: body.type || type,
    version: version + 1
  }))
  .then(formatObject)

export const connect = (config = {}) => configure({
  location: config.location,
  migrations: `${__dirname}/../../migrations`
})

export const disconnect = () => close()

export { isConnected }
