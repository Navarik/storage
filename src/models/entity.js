import { diff } from 'deep-object-diff'
import { head, errorWhen, splitName, empty } from '../utils'
import * as db from '../adapters/db'

const latest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })

export const get = (id, version) => db
  .find({
    id,
    is_deleted: 0,
    ...(version ? { version } : { is_latest: 1 })
  })
  .then(head)
  // .then(formatCollection)

export const find = params => db.find(latest(params))
  // .then(formatCollection)

export const create = body => Promise.resolve()
  .then(errorWhen(() => body.id, `Can not set new entity id to ${body.id}`))
  .then(() => db.insert(latest({ version: 1, ...body })))
  // .then(formatObject)

// export const update = (id, body) => get(id)
//   .then(errorWhen(x => !x, `Id ${id} does not exist`))
//   .then(errorWhen(old => empty(diff(old, body)), 'Versions are identical'))
//   .then(model.deprecate)
//   .then(({ version, type }) => model.createVersion({
//     ...body,
//     id,
//     type: body.type || type,
//     version: version + 1
//   }))
//   .then(formatObject)
