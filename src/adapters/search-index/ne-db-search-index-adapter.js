//@flow
import Database from 'nedb'
import map from 'poly-map'

import type { Collection, Searchable } from '../../flowtypes'
import { DBClientInterface } from './ne-db-search-index-adapter'

const databaseError = (err: string): Error => {
  throw new Error(`[NeDB] Database error: ${err}`)
}

class NeDbClient implements DBClientInterface {
  client: Object

  constructor() {
    this.reset()
  }

  find(searchParameters: Object, options: Object = {}) {
    return new Promise((resolve, reject) => {
      const query = this.client.find(searchParameters)
      if (options.skip) {
        query.skip(options.skip)
      }
      if (options.limit) {
        query.limit(options.limit)
      }

      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  insert(documents: Collection<Searchable>) {
    return new Promise((resolve, reject) =>
      this.client.insert(documents, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    )
  }

  update(searchParams: Object, document: Object) {
    return new Promise((resolve, reject) =>
      this.client.update(searchParams, document, { upsert: true, multi: true }, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    )
  }

  reset() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })

    return Promise.resolve(true)
  }

  connect() {
    return Promise.resolve(true)
  }

  isConnected() {
    return true
  }
}

export default NeDbClient
