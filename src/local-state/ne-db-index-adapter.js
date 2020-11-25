import Database from 'nedb'
import { convertSortQueriesToPairs } from '../utils'

const databaseError = (err) => {
  throw new Error(`[NeDB] Database error: ${err}`)
}

const customTerms = v => {
  if (v instanceof RegExp) {
    return { $regex: v }
  }

  return v
}

const prepareSearch = searchParams => Object.entries(searchParams || {}).reduce((acc, [k, v]) => ({ ...acc, [k]: customTerms(v) }), {})

class NeDbIndexAdapter {
  constructor() {
    this.clean = false
    this.reset()
  }

  find(searchParams, options = {}) {
    return new Promise((resolve, reject) => {
      const query = this.client.find(prepareSearch(searchParams), { _id: 0 })

      const offset = parseInt(options.offset, 10)
      if (Number.isInteger(offset)) {
        query.skip(offset)
      }

      const limit = parseInt(options.limit, 10)
      if (Number.isInteger(limit)) {
        query.limit(limit)
      }

      if (options.sort) {
        // Translate the array of sort queries from Express format to NeDB cursor.sort() format. Example:
        //    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
        //    helper function makes: [ ['vessels', 1], ['foo.bar.baz', -1], ...]
        //    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
        const nedbSortingObject = {}
        convertSortQueriesToPairs(options.sort).map(pair => nedbSortingObject[pair[0]] = pair[1])

        query.sort(nedbSortingObject)
      }

      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res || [])
      })
    })
  }

  count(searchParams) {
    return new Promise((resolve, reject) => {
      this.client.count(prepareSearch(searchParams), (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  insert(documents) {
    return new Promise((resolve, reject) =>
      this.client.insert(documents, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    )
  }

  update(searchParams, document) {
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

export default NeDbIndexAdapter
