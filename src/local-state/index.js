import objectPath from 'object-path'
import SearchIndex from './search-index'
import createIndexAdapter from './index-adapter-factory'

class LocalState {
  constructor(indexAdapter, idField, trackVersions, transform) {
    this.versions = {}
    // note that idField targets the document and not the searchableFormat in searchIndex
    this.idField = idField
    this.trackVersions = trackVersions
    this.transform = transform
    this.searchIndex = new SearchIndex(createIndexAdapter(indexAdapter), this.idField)
  }

  async exists(key) {
    const document = await this.get(key)
    return !!document
  }

  async set(item) {
    const key = objectPath.get(item, this.idField)

    let doc = JSON.parse(JSON.stringify(item))
    if (typeof this.transform === 'function') {
      try {
        doc = this.transform(doc)
      } catch (err) {
        // log error and continue without transform
        console.log('[Storage] LocalState transform encountered an exception.', err)
        doc = item
      }
    }

    // TOOD: move versions to searchIndex
    if (this.trackVersions) {
      if (!this.versions[key]) {
        this.versions[key] = []
      }

      this.versions[key].push(doc)
    }

    await this.searchIndex.add(doc)
  }

  async get(key, version) {
    if (version && this.trackVersions === false) {
      throw new Error('[Storage] Local State is running without version tracking.')
    }

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

  async find(query, options) {
    const searchables = await this.searchIndex.find(query, options)
    return searchables.map(searchable => searchable.___document)
  }

  async findContent(text, options) {
    const searchables = await this.searchIndex.findContent(text, options)
    return searchables.map(searchable => searchable.___document)
  }

  async count(query) {
    return this.searchIndex.count(query)
  }
}

export default LocalState
