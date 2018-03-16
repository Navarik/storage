import { diff } from 'deep-object-diff'
import { head, errorWhen, splitName, empty } from '../utils'
import * as db from '../adapters/db'

// export const namespaces = model.allNamespaces

const latest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })

export const get = (id, version) => db
  .find({
    is_deleted: 0,
    ...splitName('.', id),
    ...(version ? { version } : { is_latest: 1 })
  })
  .then(head)
  // .then(formatCollection)

export const find = params => db.find(latest(params))
  // .then(formatCollection)

export const create = body => db
  .find({ name: body.name, namespace: body.namespace, is_deleted: 0 })
  .then(errorWhen(x => x.length > 0, `Schema already exists: ${body.namespace}.${body.name}`))
  .then(() => db.insert(latest({ version: 1, ...body })))
  // .then(formatObject)

// export const update = (id, body) => get(id)
//   .then(errorWhen(x => !x, `Schema not found: ${id}`))
//   .then(errorWhen(old => empty(diff(old, body)), 'Schema versions are identical'))
//   .then(model.deprecate)
//   .then(({ version }) => model.create({ ...body, version: version + 1 }))
  // .then(formatObject)
