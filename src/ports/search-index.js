import createDatabase from '../adapters/db'
import { exclude, head, maybe, map } from '../utils'

const versions = createDatabase()
const latest = createDatabase()

export const getLatest = id => latest.findOne({ id })
export const getVersion = (id, version) => versions.findOne({ id })

export const add = async (document) => await Promise.all([
  versions.insert(document),
  latest.update({ id: document.id }, document, { upsert: true, multi: true })
])

export const findLatest = params => latest.find(params).then(xs => xs || [])
export const findVersions = params => versions.find(params).then(xs => xs || [])
