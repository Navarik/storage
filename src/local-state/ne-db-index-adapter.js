import Database from 'nedb'
import map from 'poly-map'

const databaseError = (err) => {
  throw new Error(`[NeDB] Database error: ${err}`)
}

class NeDbIndexAdapter {
  constructor() {
    this.reset()
  }

  find(searchParameters, options = {}) {
    return new Promise((resolve, reject) => {
      const query = this.client.find(searchParameters, { id: 1, type: 1, _id: 0 })
      if (options.offset) {
        query.skip(options.offset)
      }
      if (options.limit) {
        query.limit(options.limit)
      }

      query.exec((err, res) => {
        if (err) reject(databaseError(err))
        else resolve(res || [])
      })
    })
  }

  count(searchParameters) {
    return new Promise((resolve, reject) => {
      this.client.count(searchParameters, (err, res) => {
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
