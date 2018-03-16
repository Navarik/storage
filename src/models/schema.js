import { diff } from 'deep-object-diff'
import { head, errorWhen, splitName, empty } from '../utils'
import createDb from '../adapters/db'

let db = null

// export const namespaces = model.allNamespaces

const latest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })
const first = (data = {}) => ({ version: 1, ...data, is_latest: 1, is_deleted: 0 })

export const get = (id, version) => db.findOne({
  ...splitName('.', id),
  ...(version ? { version } : { is_latest: 1 })
})

export const find = params => db.find(latest(params))
export const create = body => db.insert(first(body))

// export const update = (id, body) => get(id)
//   .then(errorWhen(x => !x, `Schema not found: ${id}`))
//   .then(errorWhen(old => empty(diff(old, body)), 'Schema versions are identical'))
//   .then(model.deprecate)
//   .then(({ version }) => model.create({ ...body, version: version + 1 }))
  // .then(formatObject)

export const configure = conf => createDb(conf).then(client => { db = client })
export const isConnected = () => db !== null
