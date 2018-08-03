import objectPath from 'object-path'
import SearchIndex from './search-index'

class LocalState {
  constructor(indexAdapter, idField) {
    this.versions = {}
    this.latest = {}
    this.idField = idField
    this.index = new SearchIndex(indexAdapter, this.idField)
  }

  exists(key) {
    return (key in this.latest)
  }

  async set(item) {
    const key = objectPath.get(item, this.idField)

    if (!this.versions[key]) {
      this.versions[key] = []
    }

    this.versions[key].push(item)
    this.latest[key] = item

    await this.index.add(item)
  }

  get(key, version) {
    return version
      ? this.versions[key][version - 1]
      : this.latest[key]
  }

  getAll() {
    return this.latest
  }

  async reset() {
    this.latest = {}
    this.versions = {}
    await this.index.reset()
  }

  isConnected() {
    return this.index.isConnected()
  }

  async find(query, parameters) {
    const found = await this.index.find(query, parameters)
    const collection = found.map(x => this.get(x.id))

    return collection
  }

  async count(query) {
    return this.index.count(query)
  }
}

export default LocalState
