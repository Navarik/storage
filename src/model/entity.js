import createDb from '../adapters/db'

let db = null

const latest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })
const first = (data = {}) => ({ version: 1, ...data, is_latest: 1, is_deleted: 0 })

export const connect = conf => createDb(conf).then(client => { db = client })
export const isConnected = () => db !== null
export const get = (id, version) => db.findOne(version ? { id, version } : { id, is_latest: 1 })
export const find = params => db.find(latest(params))
export const create = body => db.insert(first(body))
export const createAll = body => db.insert(body.map(first))
export const update = (oldData, newData) => db
  .update({ _id: oldData._id }, { ...oldData, is_latest: 0 })
  .then(() => db.insert(latest(newData)))
