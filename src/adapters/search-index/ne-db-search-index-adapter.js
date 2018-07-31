//@flow
import Database from 'nedb'
import NeDbClient from './ne-db-client'

import type { SearchIndexAdapterInterface, Collection, Searchable } from '../../flowtypes'

export interface DBClientInterface {
  find(searchParameters: Object, options: Object): Promise<Collection<Searchable>>;
  insert(documents: Collection<Searchable>): Promise<number>;
  update(searchParams: Object, document: Object): Promise<number>;
}

class NeDbSearchIndexAdapter implements SearchIndexAdapterInterface {
  collections: { [string]: DBClientInterface }

  constructor() {
    this.collections = {}
  }

  getCollection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = new NeDbClient()
    }

    return this.collections[name]
  }

  find(name: string, searchParams: Object, options: Object) {
    return this.getCollection(name).find(searchParams, options)
  }

  insert(name: string, documents: Collection<Searchable>) {
    return this.getCollection(name).insert(documents)
  }

  update(name: string, searchParams: Object, document: Object) {
    return this.getCollection(name).update(searchParams, document)
  }

  reset() {
    this.collections = {}

    return Promise.resolve(true)
  }

  init() {
    return Promise.resolve(true)
  }

  isConnected() {
    return true
  }
}

export default NeDbSearchIndexAdapter
