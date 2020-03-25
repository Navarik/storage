import { Dictionary, Logger } from '@navarik/types'
import Database from 'nedb'
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity } from '../../types'
import { NeDbQueryParser } from './ne-db-query-parser'

interface Searchable {
  ___document: CanonicalEntity
  _id?: any
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

export class NeDbSearchIndex implements SearchIndex<CanonicalEntity> {
  private logger: Logger
  private client: Database
  private queryParser: NeDbQueryParser

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger
    this.client = new Database()
    this.queryParser = new NeDbQueryParser()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  private convertToSearchable(document: CanonicalEntity): Searchable {
    const searchable = {
      // save the original document under ___document, storage expect local-state to return ___document
      ___document: document,
      ...stringifyProperties(document)
    }

    return searchable
  }

  async find(searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity>> {
    const filter = this.queryParser.parseFilter(searchParams)
    const query = this.client.find(filter, { _id: 0 })
    const { offset, limit, sort } = options

    if (offset) {
      query.skip(parseInt(`${offset}`))
    }
    if (limit) {
      query.limit(parseInt(`${limit}`))
    }
    let sortParams
    if (sort) {
      sortParams = this.queryParser.parseSortQuery(sort instanceof Array ? sort : [sort])
      query.sort(sortParams)
    }

    this.logger.debug({ component: 'Storage.NeDbSearchIndex', filter, limit, offset, sort: sortParams }, `Performing find operation`)

    const collection: Array<Searchable> = await new Promise((resolve, reject) => {
      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve((res || []) as Array<Searchable>)
      })
    })

    return collection.map(x => x.___document)
  }

  count(searchParams: SearchQuery): Promise<number> {
    const filter = this.queryParser.parseFilter(searchParams)
    this.logger.debug({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`)

    return new Promise((resolve, reject) => {
      this.client.count(filter, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  index(document: CanonicalEntity): Promise<void> {
    const data = this.convertToSearchable(document)
    this.logger.debug({ component: 'Storage.NeDbSearchIndex', data }, `Indexing document`)

    return new Promise((resolve, reject) =>
      this.client.update(
        { id: document.id },
        data,
        { upsert: true, multi: true },
        (err) => {
          if (err) reject(databaseError(err))
          else resolve()
        }
      )
    )
  }

  update(document: CanonicalEntity): Promise<void> {
    return this.index(document)
  }

  delete(document: CanonicalEntity): Promise<void> {
    this.logger.debug({ component: 'Storage.NeDbSearchIndex', id: document.id }, `Deleting document`)

    return new Promise((resolve, reject) =>
      this.client.remove(
        { id: document.id },
        {},
        (err) => {
          if (err) reject(databaseError(err))
          else resolve()
        }
      )
    )
  }

  async up() {
    this.client = new Database()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  async down() {}

  async isHealthy() {
    return true
  }

  async isClean() {
    return false
  }
}
