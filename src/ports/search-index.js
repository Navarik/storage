import createDatabase from '../adapters/db'
import { exclude, liftToArray } from '../utils'

const defaultFormatter = liftToArray(exclude(['_id']))

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

  init(latest, versions) {
    return Promise.all([
      this.versions.insert(versions),
      this.latest.insert(latest)
    ])
  }

  add(document) {
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
