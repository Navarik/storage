import { diff } from 'deep-object-diff'
import { isConnected, configure, close } from '../adapters/db'
import { head, errorWhen, splitName, empty } from '../utils'
import * as model from './model'
import { formatCollection, formatObject } from './format'

export const namespaces = model.allNamespaces

export const get = (id, version) => model
  .search({
    is_deleted: 0,
    ...splitName('.', id),
    ...(version ? { version } : { is_latest: 1 })
  })
  .then(formatCollection)
  .then(head)

export const find = (params = {}) => model
  .search({ ...params, is_deleted: 0, is_latest: 1 })
  .then(formatCollection)

export const create = body => model
  .search({ name: body.name, namespace: body.namespace, is_deleted: 0, is_latest: 1 })
  .then(errorWhen(x => x.length > 0, `Schema already exists: ${body.namespace}.${body.name}`))
  .then(() => model.create(body))
  .then(formatObject)

export const update = (id, body) => get(id)
  .then(errorWhen(x => !x, `Schema not found: ${id}`))
  .then(errorWhen(old => empty(diff(old, body)), 'Schema versions are identical'))
  .then(model.deprecate)
  .then(({ version }) => model.create({ ...body, version: version + 1 }))
  .then(formatObject)

export const connect = (config = {}) => configure({
  location: config.location,
  migrations: `${__dirname}/../../migrations`
})

export const disconnect = () => close()

export { isConnected }
