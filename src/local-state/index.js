import objectPath from 'object-path'
import SearchIndex from './search-index'
import createIndexAdapter from './index-adapter-factory'

class LocalState {
  constructor(indexAdapter, idField, trackVersions) {
    // only init versions if trackVersions is enabled
    // this.versions will be used as a flag use to determine if version related logic should be triggered.
    if (trackVersions) {
      this.versions = {}
    }
    this.latest = {}
    this.idField = idField
    this.searchIndex = new SearchIndex(createIndexAdapter(indexAdapter), this.idField)
  }

  exists(key) {
    return (key in this.latest)
  }

  async set(item) {
    const key = objectPath.get(item, this.idField)

    if (this.versions) {
      if (!this.versions[key]) {
        this.versions[key] = []
      }

      this.versions[key].push(item)
    }

    this.latest[key] = item

    await this.searchIndex.add(item)
  }

  get(key, version) {
    if (version && !this.versions) {
      throw new Error('[Storage] Storage is running with versioning disabled.')
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
    if (this.versions) {
      this.versions = {}
    }
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
