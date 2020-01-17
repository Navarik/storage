import { SearchQuery, SearchOptions, SearchIndexAdapter, CanonicalEntity, UUID } from '../types'

type LocalStateConfig = {
  searchIndex: SearchIndexAdapter
}

export class LocalState {
  private searchIndex: SearchIndexAdapter

  constructor({ searchIndex }: LocalStateConfig) {
    this.searchIndex = searchIndex
  }

  async set(item: CanonicalEntity) {
    await this.searchIndex.index(item)
  }

  async get(key: UUID) {
    const [document] = await this.find({ id: key }, {})

    return document
  }

  async find(query: SearchQuery, options: SearchOptions) {
    return await this.searchIndex.find(query, options)
  }

  async count(query: SearchQuery) {
    return this.searchIndex.count(query)
  }

  async init() {
    await this.searchIndex.init()
  }

  async isCleant() {
    return this.searchIndex.isClean()
  }

  isConnected() {
    return this.searchIndex.isConnected()
  }
}
