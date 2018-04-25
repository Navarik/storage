import uuidv5 from 'uuid/v5'
import { on, off, send, request } from '../adapters/queue'

class ChangeLog {
  constructor(config = {}) {
    if (!config.topic) {
      throw new Error('[ChangeLog]: Topic name must be specified')
    }

    this.idGenerator = config.idGenerator
    this.topic = config.topic
    this.versions = {}

    on(this.topic, ({ payload }) => this.versions[payload.id] = payload)
  }

  latestVersion(id) {
    return this.versions[id]
  }

  logChange(data) {
    const previous = this.latestVersion(data.id) || {}
    const document = { ...previous, ...data, version: (previous.version || 0) + 1 }

    return request(this.topic, {
      ...document,
      version_id: uuidv5(JSON.stringify(document), document.id)
    })
  }

  logNew(data) {
    if (data.id) {
      throw new Error(`[ChangeLog]: Cannot re-create existing document (id: ${data.id})`)
    }

    return this.logChange({ ...data, id: this.idGenerator(data) })
  }

  observe(func) {
    on(this.topic, func)
  }

  unobserve(func) {
    off(this.topic, func)
  }
}

export default ChangeLog
