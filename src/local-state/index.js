import objectPath from 'object-path'
import SearchIndex from './search-index'
import createIndexAdapter from './index-adapter-factory'

class LocalState {
  constructor(indexAdapter, idField, trackVersions) {
    this.versions = {}
    this.latest = {}
    this.idField = idField
    this.trackVersions = trackVersions
    this.searchIndex = new SearchIndex(createIndexAdapter(indexAdapter), this.idField)
  }

  exists(key) {
    return (key in this.latest)
  }

  async set(item) {
    const key = objectPath.get(item, this.idField)

    if (this.trackVersions) {
      if (!this.versions[key]) {
        this.versions[key] = []
      }

      this.versions[key].push(item)
    }

    this.latest[key] = item

    await this.searchIndex.add(item)
  }

  get(key, version) {
    if (version && this.trackVersions === false) {
      throw new Error('[Storage] Local State is running without version tracking.')
    }

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
    await this.searchIndex.reset()
  }

  isConnected() {
    return this.searchIndex.isConnected()
  }

  async find(query, options) {
    const found = await this.searchIndex.find(query, options)
    const collection = found.map(x => this.get(x.id))

    return collection
  }

  async findContent(text, options) {
    const found = await this.searchIndex.findContent(text, options)
    const collection = found.map(x => this.get(x.id))

    return collection
  }

  async count(query) {
    return this.searchIndex.count(query)
  }
}

export default LocalState
