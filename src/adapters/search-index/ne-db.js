//@flow
import Database from 'nedb'
import logger from 'logops'
import NeDbClient from './ne-db-client'

import type { SearchIndexAdapterInterface, Collection } from '../../flowtypes'

export interface DBClientInterface {
  find(searchParameters: Object): Promise<Collection>;
  insert(documents: Collection): Promise<number>;
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

  find(collectionName: string, searchParams: Object) {
    return this.getCollection(collectionName).find(searchParams)
  }

  insert(collectionName: string, documents: Collection) {
    return this.getCollection(collectionName).insert(documents)
  }

  update(collectionName: string, searchParams: Object, document: Object) {
    return this.getCollection(collectionName).update(searchParams, document)
  }

  reset() {
    this.collections = {}

    return Promise.resolve(true)
  }
}

export default NeDbSearchIndexAdapter
