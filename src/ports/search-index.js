// @flow
import { exclude, liftToArray, identity } from '../utils'

import type { SearchIndexAdapterInterface, IndexInterface, Identifier, Collection } from '../flowtypes'

class SearchIndex {
  versions: IndexInterface
  latest: IndexInterface

  constructor(config: Object = {}) {
    this.versions = config.adapter.getIndex(`${config.bucket}.versions`)
    this.latest = config.adapter.getIndex(`${config.bucket}.latest`)
  }

  getLatest(id: Identifier) {
    return this.latest.findOne({ id })
  }

  getVersion(id: Identifier, version: number) {
    return this.versions.findOne({ id })
  }

  init(latest: Collection, versions: Collection) {
    return Promise.all([
      this.versions.insert(versions),
      this.latest.insert(latest)
    ])
  }

  add(document: Object) {
    return Promise.all([
      this.versions.insert([document]),
      this.latest.update({ id: document.id }, document)
    ])
  }

  findLatest(params: Object) {
    return this.latest.find(params).then(xs => xs || [])
  }

  findVersions(params: Object) {
    return this.versions.find(params).then(xs => xs || [])
  }
}

export default SearchIndex
