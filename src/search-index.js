// @flow
import map from 'poly-map'
import { maybe } from './utils'

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

  constructor(adapter: SearchIndexAdapterInterface) {
    this.adapter = adapter
  }

  async init(log: Collection<ChangeRecord>) {
    await this.adapter.connect()
    await this.adapter.reset()
    await this.adapter.insert(Object.values(log).map(searchableFormat))
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  async add(document: ChangeRecord) {
    const searchable = searchableFormat(document)
    await this.adapter.update({ id: document.id }, searchable)
  }

  async addCollection(documents: Collection<ChangeRecord>) {
    const searchable = documents.map(searchableFormat)
    return map(x => this.adapter.update({ id: x.id }, x), searchable)
  }

  async find(params: Object = {}, limit: ?number, skip: ?number) {
    return this.adapter.find(map(stringifyProperties, params), { skip, limit })
  }
}

export default SearchIndex
