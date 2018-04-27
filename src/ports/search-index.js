import createDatabase from '../adapters/db'
import { exclude, liftToArray } from '../utils'

const defaultFormatter = liftToArray(exclude(['_id']))
const identity = x => x

class SearchIndex {
  constructor(config = {}) {
    this.formatIn = config.formatIn || identity
    this.formatOut = config.formatOut || defaultFormatter
    this.versions = createDatabase()
    this.latest = createDatabase()
  }

  getLatest(id) {
    return this.latest.findOne({ id }).then(x => this.formatOut(x))
  }

  getVersion(id, version) {
    return this.versions.findOne({ id }).then(x => this.formatOut(x))
  }

  init(latest, versions) {
    return Promise.all([
      this.versions.insert(this.formatIn(versions)),
      this.latest.insert(this.formatIn(latest))
    ])
  }

  add(document) {
    const searchable = this.formatIn(document)

    return Promise.all([
      this.versions.insert(searchable),
      this.latest.update({ id: searchable.id }, searchable, { upsert: true, multi: true })
    ])
  }

  findLatest(params) {
    return this.latest.find(params).then(xs => xs || []).then(xs => this.formatOut(xs))
  }

  findVersions(params) {
    return this.versions.find(params).then(xs => xs || []).then(xs => this.formatOut(xs))
  }
}

export default SearchIndex
