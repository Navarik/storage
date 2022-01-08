import { Logger } from '@navarik/types'
import Database from '@navarik/nedb'
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, ActionType, CanonicalSchema } from '../../types'
import { NeDbQueryParser } from './ne-db-query-parser'
import { FullTextFieldExtractor } from './fulltext-field-extractor'

interface Config {
  logger: Logger
}

const callback = (resolve, reject) => (err: Error, res) => {
  if (err) {
    reject(new Error(`[NeDB] Database error: ${err.message}`))
  } else {
    resolve(res)
  }
}

export class NeDbSearchIndex<M extends object> implements SearchIndex<M> {
  private logger: Logger
  private documents: Database
  private fullText: Database
  private queryParser: NeDbQueryParser
  private fullTextFieldExtractor: FullTextFieldExtractor

  constructor({ logger }: Config) {
    this.logger = logger
    this.documents = new Database()
    this.fullText = new Database()
    this.queryParser = new NeDbQueryParser({ documentsDb: this.documents, fullTextDb: this.fullText })
    this.fullTextFieldExtractor = new FullTextFieldExtractor({ callback: this.onFullTextUpdate.bind(this) })
  }

  private onFullTextUpdate(key: string, id: string, text :string) {
    return new Promise((resolve, reject) =>
      this.fullText.update({ id, key }, { id, key, text }, { upsert: true, multi: true }, callback(resolve, reject))
    )
  }

  private async index<B extends object, M extends object>(document: CanonicalEntity<B, M>, schema: CanonicalSchema): Promise<void> {
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', document }, `Indexing document`)

    if (schema.fields) {
      schema.fields.forEach(x =>
        this.fullTextFieldExtractor.extract(x, document.body, { id: document.id, key: document.id })
      )
    }

    return new Promise((resolve, reject) =>
      this.documents.update(
        { id: document.id },
        document,
        { upsert: true, multi: true },
        callback(resolve, reject)
      )
    )
  }

  private async delete<B extends object, M extends object>(document: CanonicalEntity<B, M>): Promise<void> {
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', id: document.id }, `Deleting document`)

    await Promise.all([
      new Promise((resolve, reject) =>
        this.documents.remove({ id: document.id }, {}, callback(resolve, reject))
      ),
      new Promise((resolve, reject) =>
        this.fullText.remove({ id: document.id }, {}, callback(resolve, reject))
      )
    ])
  }

  async find<B extends object, M extends object>(searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<B, M>>> {
    const filter = await this.queryParser.parseFilter(searchParams)
    const query = this.documents.find(filter, { _id: 0 })
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
      query.exec(callback(resolve, reject))
    })

    return collection || []
  }

  async count(searchParams: SearchQuery): Promise<number> {
    const filter = await this.queryParser.parseFilter(searchParams)
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`)

    return new Promise((resolve, reject) => {
      this.documents.count(filter, callback(resolve, reject))
    })
  }

  async update<B extends object, M extends object>(action: ActionType, document: CanonicalEntity<B, M>, schema: CanonicalSchema): Promise<void> {
    if (action === "create" || action === "update") {
      await this.index(document, schema)
    } else if (action === "delete")  {
      await this.delete(document)
    } else {
      throw new Error(`Unknown action: ${action}`)
    }
  }

  async up() {
    await new Promise((resolve, reject) => {
      this.documents.ensureIndex({ fieldName: 'type' }, callback(resolve, reject))
    })
    await new Promise((resolve, reject) => {
      this.documents.ensureIndex({ fieldName: 'id', unique: true }, callback(resolve, reject))
    })
  }

  async down() {}

  async isHealthy() {
    return true
  }

  async isClean() {
    return false
  }
}
