//@flow
import Database from 'nedb'
import exclude from 'poly-exclude'
import map from 'poly-map'
import { maybe } from '../../utils'

import type { Collection, Searchable } from '../../flowtypes'
import { DBClientInterface } from './ne-db'

const format = maybe(exclude(['_id']))

const databaseError = (err: string): Error => {
  throw new Error(`[NeDB] Database error: ${err}`)
}

class NeDbClient implements DBClientInterface {
  client: Object

  constructor() {
    this.client = new Database()
  }

  find(searchParameters: Object) {
    return new Promise((resolve, reject) =>
      this.client.find(searchParameters, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(map(format, res))
      })
    )
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
}

export default NeDbClient
