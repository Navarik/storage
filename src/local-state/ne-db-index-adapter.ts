import { Dictionary } from '@navarik/types'
import Database from 'nedb'
import { SearchIndexAdapter, SearchQuery, SearchOptions, CanonicalEntity, UUID } from '../types'

interface Searchable {
  ___document: CanonicalEntity
  _id?: any
  id: UUID
  type: string
}

const stringifyProperties = (data: any): any => {
  if (!data) return ''

  if (data instanceof Array) {
    return data.map(stringifyProperties)
  }

  if (typeof data ==='object') {
    const stringified: Dictionary<any> = {}
    for (const field in data) {
      if (typeof data[field] !== 'function') {
        stringified[field] = stringifyProperties(data[field])
      }
    }
    return stringified
  }

  return `${data}`
}

const databaseError = (err: Error) => {
  throw new Error(`[NeDB] Database error: ${err.message}`)
}

export class NeDbIndexAdapter implements SearchIndexAdapter {
  private client: Database

  constructor() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  private convertToSearchable(document: CanonicalEntity): Searchable {
    const searchable = {
      // save the original document under ___document, storage expect local-state to return ___document
      ___document: document,
      id: document.id,
      type: document.type,
      ...stringifyProperties(document.body)
    }

    return searchable
  }

  /**
    * Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
    *    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
    *    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
   * @param {string|string[]} sortQueries - A single sort query string or an array of sort query strings in descending priority.
   * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
   */
  private parseSortQuery(sortQueries: Array<string>): Dictionary<number> {
    const result: Dictionary<number> = {}
    for (const item of sortQueries) {
      const [field, order] = item.split(':')
      result[field] = (order || '').trim().toLowerCase() === 'desc' ? -1 : 1
    }

    return result
  }

  async find(searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity>> {
    const query = this.client.find(stringifyProperties(searchParams), { _id: 0 })
    const { offset, limit, sort } = options

    if (offset) {
      query.skip(parseInt(`${offset}`))
    }
    if (limit) {
      query.limit(parseInt(`${limit}`))
    }
    if (sort) {
      const nedbSortingObject = this.parseSortQuery(sort instanceof Array ? sort : [sort])
      query.sort(nedbSortingObject)
    }

    const collection: Array<Searchable> = await new Promise((resolve, reject) => {
      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve((res || []) as Array<Searchable>)
      })
    })

    return collection.map(x => x.___document)
  }

  count(searchParams: SearchQuery): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.count(stringifyProperties(searchParams), (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  index(document: CanonicalEntity): Promise<void> {
    return new Promise((resolve, reject) =>
      this.client.update(
        { id: document.id },
        this.convertToSearchable(document),
        { upsert: true, multi: true },
        (err) => {
          if (err) reject(databaseError(err))
          else resolve()
        }
      )
    )
  }

  async init() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  isConnected() {
    return true
  }

  async isClean() {
    return false
  }
}
