//@flow
import Database from 'nedb'
import logger from 'logops'
import { enforceArray, map, head } from '../../utils'
import NeDbIndex from './ne-db-index'

import type { SearchIndexAdapterInterface } from '../../flowtypes'

const databaseError = (err: string): Error => {
  logger.error(`[NeDB] Database error: ${err}`)

  return new Error(err)
}

const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

class NeDbSearchIndexAdapter implements SearchIndexAdapterInterface {
  clients: { [string]: Object }

  constructor() {
    this.clients = {}
  }

  getIndex(name: string) {
    if (!this.clients[name]) {
      const client = new Database()

      this.clients[name] = new NeDbIndex({
        find: promisify((...args) => client.find(...args)),
        insert: promisify((...args) => client.insert(...args)),
        update: promisify((...args) => client.update(...args))
      })
    }

    return this.clients[name]
  }
}

export default NeDbSearchIndexAdapter
