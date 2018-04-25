import createDatabase from '../adapters/db'
import { exclude, map, liftToArray, isPlaneObject } from '../utils'

const defaultFormatter = liftToArray(exclude(['_id']))

const stringifyFields = map(value => (
  (value instanceof Array || isPlaneObject(value))
    ? stringifyFields(value)
    : String(value)
))

class SearchIndex {
  constructor(config = {}) {
    this.format = config.format || defaultFormatter
    this.versions = createDatabase()
    this.latest = createDatabase()
  }

  getLatest(id) {
    return this.latest.findOne({ id }).then(x => this.format(x))
  }

  getVersion(id, version) {
    return this.versions.findOne({ id }).then(x => this.format(x))
  }

  add(document) {
// const searchable = stringifyFields(document)
// console.log(searchable)
    const searchable = document

    return Promise.all([
      this.versions.insert(searchable),
      this.latest.update({ id: searchable.id }, searchable, { upsert: true, multi: true })
    ])
  }

  findLatest(params) {
    return this.latest.find(params).then(xs => xs || []).then(xs => this.format(xs))
  }

  findVersions(params) {
    return this.versions.find(params).then(xs => xs || []).then(xs => this.format(xs))
  }
}

export default SearchIndex
