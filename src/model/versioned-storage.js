import createDb from '../adapters/db'
import { head } from '../utils'

const asLatest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })
const asFirst = (data = {}) => ({ version: 1, ...data, is_latest: 1, is_deleted: 0 })

class VersionedStorage {
  constructor(config) {
    this.db = null
    this.config = config
  }

  connect(config) {
    return createDb(config || this.config).then(client => { this.db = client })
  }

  isConnected() {
    return this.db !== null
  }

  findOne(params, version) {
    return this.db.findOne(version
      ? { ...params, version: Number(version) }
      : { ...params, is_latest: 1 }
    )
  }

  find(params) {
    return this.db.find(asLatest(params))
  }

  create(body) {
    return this.db.insert([asFirst(body)]).then(head)
  }

  createAll(body) {
    return this.db.insert(body.map(asFirst))
  }

  update(oldData, newData) {
    return this.db
      .update({ _id: oldData._id }, { ...oldData, is_latest: 0 })
      .then(() => this.db.insert(asLatest(newData)))
  }
}

export default VersionedStorage
