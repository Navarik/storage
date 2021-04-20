import { Dictionary, Logger } from '@navarik/types'
import Database from 'nedb'
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, ActionType } from '../../types'
import { NeDbQueryParser } from './ne-db-query-parser'

interface Searchable<B extends object, M extends object> {
  ___document: CanonicalEntity<B, M>
  _id?: any
}

type Config = {
  logger: Logger
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

export class NeDbSearchIndex<M extends object> implements SearchIndex<M> {
  private logger: Logger
  private client: Database
  private queryParser: NeDbQueryParser

  constructor({ logger }: Config) {
    this.logger = logger
    this.client = new Database()
    this.queryParser = new NeDbQueryParser()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  private async convertToSearchable<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<Searchable<B, M>> {
    // Removing ACL and other additional terms
    const originalDocument = {
      id: document.id,
      version_id: document.version_id,
      previous_version_id: document.previous_version_id,
      created_by: document.created_by,
      created_at: document.created_at,
      modified_by: document.modified_by,
      modified_at: document.modified_at,
      type: document.type,
      body: document.body,
      meta: document.meta,
      schema: document.schema
    }

    const searchable = {
      ___document: originalDocument,
      ...stringifyProperties(document)
    }

    return searchable
  }

  async find<B extends object, M extends object>(searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<B, M>>> {
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
      sortParams = this.queryParser.parseSort(sort instanceof Array ? sort : [sort])
      query.sort(sortParams)
    }

    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter, limit, offset, sort: sortParams }, `Performing find operation`)

    const collection: Array<Searchable<B, M>> = await new Promise((resolve, reject) => {
      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve((res || []) as Array<Searchable<B, M>>)
      })
    })

    return collection.map(x => x.___document)
  }

  async count(searchParams: SearchQuery): Promise<number> {
    const filter = this.queryParser.parseFilter(searchParams)
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`)

    return new Promise((resolve, reject) => {
      this.client.count(filter, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  async index<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<void> {
    const data = await this.convertToSearchable(document)
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', data }, `Indexing document`)

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

  async update<B extends object, M extends object>(action: ActionType, document: CanonicalEntity<B, M>): Promise<void> {
    if (action === "create" || action === "update") {
      await this.index(document)
    } else if (action === "delete")  {
      await this.delete(document)
    } else {
      throw new Error(`[Storage] Unknown action: ${action}`)
    }
  }

  delete<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<void> {
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', id: document.id }, `Deleting document`)

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
