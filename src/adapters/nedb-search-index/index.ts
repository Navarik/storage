import { Logger } from '@navarik/types'
import Database from '@navarik/nedb'
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, ActionType } from '../../types'
import { NeDbQueryParser } from './ne-db-query-parser'


type Config = {
  logger: Logger
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
    this.queryParser = new NeDbQueryParser({ db: this })
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  async find<B extends object, M extends object>(searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<B, M>>> {
    const filter = await this.queryParser.parseFilter(searchParams)
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

    const collection: Array<CanonicalEntity<B, M>> = await new Promise((resolve, reject) => {
      query.exec((err: Error, res: Array<CanonicalEntity<B, M>>) => {
        if (err) reject(databaseError(err))
        else resolve((res || []))
      })
    })

    return collection
  }

  async count(searchParams: SearchQuery): Promise<number> {
    const filter = await this.queryParser.parseFilter(searchParams)
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`)

    return new Promise((resolve, reject) => {
      this.client.count(filter, (err: Error, res: number) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  async index<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<void> {
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', document }, `Indexing document`)

    return new Promise((resolve, reject) =>
      this.client.update(
        { id: document.id },
        document,
        { upsert: true, multi: true },
        (err: Error) => {
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
      throw new Error(`Unknown action: ${action}`)
    }
  }

  delete<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<void> {
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', id: document.id }, `Deleting document`)

    return new Promise((resolve, reject) =>
      this.client.remove(
        { id: document.id },
        {},
        (err: Error) => {
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
