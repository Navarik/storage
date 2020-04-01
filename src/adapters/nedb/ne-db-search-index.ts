import { Dictionary, Logger } from '@navarik/types'
import Database from 'nedb'
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, AccessControlAdapter, AccessType, UUID } from '../../types'
import { NeDbQueryParser } from './ne-db-query-parser'

interface Searchable {
  ___document: CanonicalEntity
  ___acl: any
  _id?: any
}

type Config = {
  accessControl: AccessControlAdapter<CanonicalEntity>
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

export class NeDbSearchIndex implements SearchIndex<CanonicalEntity> {
  private accessControl: AccessControlAdapter<CanonicalEntity>
  private logger: Logger
  private client: Database
  private queryParser: NeDbQueryParser

  constructor({ accessControl, logger }: Config) {
    this.accessControl = accessControl
    this.logger = logger
    this.client = new Database()
    // this.queryParser = new NeDbQueryParser(this.accessControl)
    this.queryParser = new NeDbQueryParser()
    this.client.ensureIndex({ fieldName: 'id', unique: true })
  }

  private async convertToSearchable(document: CanonicalEntity): Promise<Searchable> {
    const acl = await this.accessControl.createAcl(document)
    const searchable = {
      // save the original document under ___document, storage expect local-state to return ___document
      ___document: document,
      ___acl: acl,
      ...stringifyProperties(document)
    }

    return searchable
  }

  private async prepareFilter(user: UUID, access: AccessType, searchParams: SearchQuery) {
    const aclTerms = await this.accessControl.getQueryTerms(user, access)
    const searchFilter = this.queryParser.parseFilter(searchParams)

    const aclFilter = {
      $and: [
        {
          $or: aclTerms.dac.map(t => ({'___acl.dac': { $elemMatch: t }}))
        },
        {
          $or: aclTerms.mac.map(t => ({'___acl.mac': { $elemMatch: t }}))
        },
      ]
    }

    return {
      ...searchFilter,
      ...aclFilter,
    }
  }

  async find(user: UUID, searchParams: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity>> {
    const filter = await this.prepareFilter(user, 'read', searchParams)
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

    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter, limit, offset, sort: sortParams }, `Performing find operation`)

    const collection: Array<Searchable> = await new Promise((resolve, reject) => {
      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve((res || []) as Array<Searchable>)
      })
    })

    return collection.map(x => x.___document)
  }

  async count(user: UUID, searchParams: SearchQuery): Promise<number> {
    const filter = await this.prepareFilter(user, 'read', searchParams)
    this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`)

    return new Promise((resolve, reject) => {
      this.client.count(filter, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  async index(document: CanonicalEntity): Promise<void> {
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

  update(document: CanonicalEntity): Promise<void> {
    return this.index(document)
  }

  delete(document: CanonicalEntity): Promise<void> {
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
