import uuidv5 from 'uuid/v5'
import createDb from '../adapters/db'
import { exclude, head, maybe, map } from '../utils'

const asLatest = (data = {}) => ({ ...data, is_latest: 1, is_deleted: 0 })
const asFirst = (data = {}) => ({ ...data, version: 1, is_latest: 1, is_deleted: 0 })

const format = maybe(exclude(['_id', 'is_latest', 'is_deleted']))

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
      id: this.idGenerator(data, data.id)
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

  get(id) {
    return this.db.findOne({ id, is_latest: 1 }).then(format)
  }

  getVersion(vid) {
    return this.db.findOne({ version_id: vid }).then(format)
  }

  findOne(params, version) {
    return this.db.findOne(version
      ? { ...params, version: Number(version) }
      : { ...params, is_latest: 1 }
    ).then(format)
  }

  find(params) {
    return this.db.find(asLatest(params)).then(map(format))
  }

  findAll(params) {
    return this.db.find(params).then(map(format))
  }

  create(body) {
    return createAll([body]).then(head)
  }

  createAll(body) {
    return this.db
      .insert(body.map(item => asFirst(this.addVersionId(this.addId(item)))))
      .then(map(format))
  }

  update(oldData, newData) {
    return this.db
      .update({ id: oldData.id }, { ...oldData, is_latest: 0 })
      .then(() => this.db.insert(asLatest(this.addVersionId({
        ...newData,
        id: oldData.id,
        version: oldData.version + 1
      }))))
      .then(head)
      .then(format)
  }
}

export default VersionedStorage
