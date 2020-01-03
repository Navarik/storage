import * as objectPath from 'object-path'
import { SearchIndex } from './search-index'
import { createIndexAdapter } from './index-adapter-factory'

export class LocalState {
  private versions
  private idField: string
  private searchIndex

  constructor(indexAdapter, idField) {
    this.versions = {}
    // note that idField targets the document and not the searchableFormat in searchIndex
    this.idField = idField
    this.searchIndex = new SearchIndex(createIndexAdapter(indexAdapter), this.idField)
  }

  async exists(key) {
    const document = await this.get(key)
    return !!document
  }

  async set(item) {
    const key = objectPath.get(item, this.idField)

    let doc = JSON.parse(JSON.stringify(item))
    if (!this.versions[key]) {
      this.versions[key] = []
    }

    this.versions[key].push(doc)

    await this.searchIndex.add(doc)
  }

  async get(key, version = 0) {
    const documents = await this.find({ id: key })
    const latest = documents.length ? documents[0] : undefined

    return version
      ? this.versions[key][version - 1]
      : latest
  }

  async getAll() {
    return this.find()
  }

  async reset() {
    this.versions = {}
    await this.searchIndex.reset()
  }

  isConnected() {
    return this.searchIndex.isConnected()
  }

  async find(query = {}, options = {}) {
    return await this.searchIndex.find(query, options)
  }

  async findContent(text, options = {}) {
    return await this.searchIndex.findContent(text, options)
  }

  async count(query) {
    return this.searchIndex.count(query)
  }
}
