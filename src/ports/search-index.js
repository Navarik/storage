// @flow
import arraySort from 'array-sort'
import groupBy from 'group-by'
import map from 'poly-map'

import type { SearchIndexInterface, SearchIndexAdapterInterface, Collection } from '../flowtypes'

const sortByVersionNumber = data => arraySort(data, 'version', { reverse: true })

class SearchIndex implements SearchIndexInterface {
  adapter: SearchIndexAdapterInterface

  constructor(config: Object = {}) {
    this.adapter = config.adapter
  }

  init(log: Collection) {
    const versions = Object.values(groupBy(log, 'id'))
    const latest = map(sortByVersionNumber, versions)

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
