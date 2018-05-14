//@flow
import Database from 'nedb'
import logger from 'logops'
import { map, maybe, exclude } from '../../utils'

import type { Collection } from '../../flowtypes'
import { DBClientInterface } from './ne-db'

const format = maybe(exclude(['_id']))

const databaseError = (err: string): Error => {
  logger.error(`[NeDB] Database error: ${err}`)

  return new Error(err)
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

  insert(documents: Collection) {
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
