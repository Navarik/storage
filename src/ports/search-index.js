// @flow
import arraySort from 'array-sort'
import groupBy from 'group-by'
import map from 'poly-map'
import pipe from 'function-pipe'
import flatten from 'array-flatten'
import { maybe, head } from '../utils'

import type { SearchIndexInterface, Searchable, SearchIndexAdapterInterface, Collection } from '../flowtypes'

const sortByVersionNumber = data => arraySort(data, 'version', { reverse: true })

const stringifyProperties = maybe(value => (
  typeof value === 'object'
    ? map(stringifyProperties, value)
    : String(value)
))

const searchableFormat = document => ({
  id: document.id,
  version: String(document.version),
  version_id: document.version_id,
  type: document.type,
  ...stringifyProperties(document.body)
})

class SearchIndex implements SearchIndexInterface {
  adapter: SearchIndexAdapterInterface

  constructor(adapter: SearchIndexAdapterInterface) {
    this.adapter = adapter
  }

  init(log: Collection<Searchable>) {
    const versions = Object.values(groupBy(log, 'id'))
    const latest = map(pipe(sortByVersionNumber, head), versions)

    return this.adapter
      .reset()
      .then(() => Promise.all([
        this.adapter.insert('versions', log.map(searchableFormat)),
        this.adapter.insert('latest', latest.map(searchableFormat))
      ])
    )
  }

  add(document: Object) {
    const searchable = searchableFormat(document)

    return Promise.all([
      this.adapter.insert('versions', [searchable]),
      this.adapter.update('latest', { id: document.id }, searchable)
    ])
  }

  addCollection(documents: Array<Object>) {
    const searchable = documents.map(searchableFormat)

    return Promise.all([
      this.adapter.insert('versions', searchable),
      ...searchable.map(x => this.adapter.update('latest', { id: x.id }, x))
    ])
  }

  findLatest(params: Object) {
    return this.adapter
      .find('latest', stringifyProperties(params))
      .then(xs => xs || [])
  }

  findVersions(params: Object) {
    return this.adapter
      .find('versions', stringifyProperties(params))
      .then(xs => xs || [])
  }
}

export default SearchIndex
