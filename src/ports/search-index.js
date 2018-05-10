// @flow
import { exclude, liftToArray } from '../utils'

import type { SearchIndexAdapterInterface, IndexInterface, Formatter, Identifier, Collection } from '../flowtypes'

const defaultFormatter: Formatter = liftToArray(exclude(['_id']))
const identity = <T>(x: T): T => x

class SearchIndex {
  versions: IndexInterface
  latest: IndexInterface
  formatIn: Formatter
  formatOut: Formatter

  constructor(config: Object = {}) {
    this.formatIn = config.formatIn || identity
    this.formatOut = config.formatOut || defaultFormatter
    this.versions = config.adapter.getIndex(`${config.namespace}.versions`)
    this.latest = config.adapter.getIndex(`${config.namespace}.latest`)
}

  getLatest(id: Identifier) {
    return this.latest.findOne({ id }).then(x => this.formatOut(x))
  }

  getVersion(id: Identifier, version: number) {
    return this.versions.findOne({ id }).then(x => this.formatOut(x))
  }

  init(latest: Collection, versions: Collection) {
    return Promise.all([
      this.versions.insert(this.formatIn(versions)),
      this.latest.insert(this.formatIn(latest))
    ])
  }

  add(document: Object) {
    const searchable = this.formatIn(document)

    return Promise.all([
      this.versions.insert([searchable]),
      this.latest.update({ id: searchable.id }, searchable)
    ])
  }

  findLatest(params: Object) {
    return this.latest.find(params).then(xs => xs || []).then(xs => this.formatOut(xs))
  }

  findVersions(params: Object) {
    return this.versions.find(params).then(xs => xs || []).then(xs => this.formatOut(xs))
  }
}

export default SearchIndex
