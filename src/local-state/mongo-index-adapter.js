import { MongoClient } from 'mongodb'
import omit from 'object.omit'
import { convertSortQueriesToPairs } from '../utils'

const databaseError = (err) => {
  throw new Error(`[MongoDB] Database error: ${err}`)
}

const mongifySort = src => {
  if (!src) {
    return null
  }

  return convertSortQueriesToPairs(src).map(([field, order]) => ([`body.${field}`, order]))
}

const mongifyOptions = options => {
  const allParams = {
    projection: { id: 1, type: 1, _id: 0 },
    skip: parseInt(options.offset) || 0,
    limit: parseInt(options.limit) || 100,
    sort: mongifySort(options.sort),
  }

  return omit(allParams, v => v != null)
}

const mongifySearch = (searchParams) => {
  const { $where, id, version, version_id, type, ___content, ...body } = searchParams
  const allParams = {
    $where,
    id,
    version,
    version_id,
    type,
    ___content,
    ...Object.entries(body).reduce((acc, [k, v]) => ({ ...acc, [`body.${k}`]: v }), {})
  }

  return omit(allParams, v => v != null)
}

const collectBody = ({ id, version, version_id, type, ___content, ...body }) =>
  ({ id, version, version_id, type, ___content, body })


class MongoDbIndexAdapter {
  constructor(config) {
    this.config = {
      url: config.url || 'mongodb://localhost:27017',
      db: config.db || 'storage',
      collection: config.collection || 'data',
    }

    this.supportsRegex = true
    this.pendingReset = null
    this.reset()
  }

  find(searchParams, options = {}) {
    const mo = mongifyOptions(options)
    const msp = mongifySearch(searchParams)
    return new Promise((resolve, reject) => {
      try {
        const cursor = this.collection.find(msp, mo)
        cursor.toArray().then(arr => {
          resolve(arr)
        })
      } catch (e) {
        reject(databaseError(e))
      }
    })
  }

  count(searchParams) {
    const msp = mongifySearch(searchParams)
    return new Promise((resolve, reject) => {
      this.collection.countDocuments(msp, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  insert(documents) {
    const searchDocs = documents.map(collectBody)
    return new Promise((resolve, reject) =>
      this.collection.insertMany(searchDocs, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    )
  }

  update(searchParams, document) {
    return new Promise((resolve, reject) => {
      const searchDoc = collectBody(document)
      this.collection.updateOne(searchParams, { $set: searchDoc }, { upsert: true }, (err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res)
      })
    })
  }

  reset() {
    if (this.pendingReset) {
      return Promise.resolve(this.pendingReset)
    }

    if (this.client) {
      this.client.close()
      this.client = null
    }

    this.pendingReset = new Promise((resolve, reject) => {
      MongoClient.connect(this.config.url, { useNewUrlParser: true }, (err, client) => {
        if (err) {
          reject(err)
          return
        }

        this.client = client

        const db = client.db(this.config.db)

        db.collection(this.config.collection, (err, col) => {
          if (err) {
            reject(err)
            return
          }

          this.collection = col

          this.collection.createIndex({ id: 1 }, { unique: true }).then(() => resolve(true))
        })
      })
    })

    return this.pendingReset
  }

  connect() {
    return Promise.resolve(this.pendingReset)
  }

  isConnected() {
    return !!this.client
  }
}

export default MongoDbIndexAdapter
