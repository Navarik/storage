// @flow
import { exclude, liftToArray, identity, map, groupBy, arraySort, head } from '../utils'

import type { SearchIndexInterface, SearchIndexAdapterInterface, Identifier, Collection } from '../flowtypes'

class SearchIndex implements SearchIndexInterface {
  adapter: SearchIndexAdapterInterface

  constructor(config: Object = {}) {
    this.adapter = config.adapter
  }

  init(log: Collection) {
    const versions = groupBy(log, 'id')
    const latest = map(xs => head(arraySort(xs, 'version')), Object.values(versions))

    return this.adapter
      .reset()
      .then(() => Promise.all([
        this.adapter.insert('versions', log),
        this.adapter.insert('latest', latest)
      ])
    )
  }

  add(document: Object) {
    return Promise.all([
      this.adapter.insert('versions', [document]),
      this.adapter.update('latest', { id: document.id }, document)
    ])
  }

  findLatest(params: Object) {
    return this.adapter.find('latest', params).then(xs => xs || [])
  }

  findVersions(params: Object) {
    return this.adapter.find('versions', params).then(xs => xs || [])
  }
}

export default SearchIndex
