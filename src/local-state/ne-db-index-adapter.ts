import * as Database from 'nedb'
import { SearchIndexAdapter, SearchQuery, SearchOptions } from '../types'
import { parseSortQuery, prepareSearch } from './query-language'

const databaseError = (err) => {
  throw new Error(`[NeDB] Database error: ${err}`)
}

export class NeDbIndexAdapter implements SearchIndexAdapter {
  private client: Database

  constructor() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  find(searchParams: SearchQuery, { offset, limit, sort }: SearchOptions = {}) {
    const query = this.client.find(prepareSearch(searchParams), { _id: 0 })

    if (offset) {
      query.skip(offset)
    }
    if (limit) {
      query.limit(limit)
    }
    if (sort) {
      // Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
      //    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
      //    helper function makes: [ ['vessels', 1], ['foo.bar.baz', -1], ...]
      //    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
      const nedbSortingObject = parseSortQuery(sort)
        .reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})

      query.sort(nedbSortingObject)
    }

    return new Promise((resolve, reject) => {
      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res || [])
      })
    })
  }

  count(searchParams: SearchQuery) {
    return new Promise((resolve, reject) => {
      this.client.count(prepareSearch(searchParams), (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  index(documents) {
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

  async reset() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  connect() {
    return Promise.resolve(true)
  }

  isConnected() {
    return true
  }
}
