import uuidv5 from 'uuid/v5'
import createDb from '../adapters/db'
import { head } from '../utils'

const asLatest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })
const asFirst = (data = {}) => ({ version: 1, ...data, is_latest: 1, is_deleted: 0 })

class VersionedStorage {
  constructor(config) {
    this.db = null
    this.config = config
    this.idGenerator = config.idGenerator
  }

  addId(data) {
    if (data.id) {
      return id
    }

    return {
      ...data,
      id: this.idGenerator(JSON.stringify(data), data.id)
    }
  }

  addVersionId(data) {
    return {
      ...data,
      version_id: uuidv5(JSON.stringify(data), data.id)
    }
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
    return createAll([body]).then(head)
  }

  createAll(body) {
    return this.db.insert(body.map(item => asFirst(this.addVersionId(this.addId(item)))))
  }

  update(oldData, newData) {
    return this.db
      .update({ id: oldData.id }, { ...oldData, is_latest: 0 })
      .then(() => this.db.insert(asLatest(this.addVersionId(newData))))
  }
}

export default VersionedStorage
