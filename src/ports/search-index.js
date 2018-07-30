// @flow
import map from 'poly-map'
import { maybe } from '../utils'

import type { ChangeRecord, DocumentBody, SearchIndexInterface, Searchable, SearchIndexAdapterInterface, Collection } from '../flowtypes'

const stringifyProperties = maybe(value => (
  typeof value === 'object'
    ? map(stringifyProperties, value)
    : String(value)
))

const searchableFormat = (document: ChangeRecord) => ({
  ...map(stringifyProperties, document.body),
  id: document.id,
  version: String(document.version),
  version_id: document.version_id,
  type: document.type
})

class SearchIndex implements SearchIndexInterface {
  adapter: SearchIndexAdapterInterface
  name: string

  constructor(name: string, adapter: SearchIndexAdapterInterface) {
    this.adapter = adapter
    this.name = name
  }

  async init(log: Collection<ChangeRecord>) {
    await this.adapter.reset()
    await this.adapter.insert(this.name, Object.values(log).map(searchableFormat))
  }

  async add(document: ChangeRecord) {
    const searchable = searchableFormat(document)
    await this.adapter.update(this.name, { id: document.id }, searchable)
  }

  async addCollection(documents: Collection<ChangeRecord>) {
    const searchable = documents.map(searchableFormat)
    return map(x => this.adapter.update(this.name, { id: x.id }, x), searchable)
  }

  async find(params: Object = {}) {
    return this.adapter.find(this.name, map(stringifyProperties, params))
  }
}

export default SearchIndex
