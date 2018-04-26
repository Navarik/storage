import uuidv5 from 'uuid/v5'
import TransactionManager from './transaction-manager'

class ChangeLog {
  constructor(config = {}) {
    if (!config.topic) {
      throw new Error('[ChangeLog]: Topic name must be specified')
    }

    if (!config.queue) {
      throw new Error('[ChangeLog]: Queue adapter must be specified')
    }

    this.queue = config.queue
    this.idGenerator = config.idGenerator
    this.topic = config.topic
    this.versions = {}
    this.transactionManager = new TransactionManager({
      queue: this.queue,
      commitTopic: this.topic,
      onCommit: payload => this.versions[payload.id] = payload
    })
  }

  latestVersion(id) {
    return this.versions[id]
  }

  logChange(data) {
    const previous = this.latestVersion(data.id) || {}
    const document = {
      ...previous,
      ...data,
      version: (previous.version || 0) + 1
    }
    const signedDocument = {
      ...document,
      version_id: uuidv5(JSON.stringify(document), document.id)
    }

    return this.transactionManager.execute(this.topic, signedDocument)
  }

  logNew(data) {
    if (data.id) {
      throw new Error(`[ChangeLog]: Cannot re-create existing document (id: ${data.id})`)
    }

    return this.logChange({ ...data, id: this.idGenerator(data) })
  }

  observe(func) {
    this.queue.on(this.topic, func)
  }

  unobserve(func) {
    this.queue.off(this.topic, func)
  }
}

export default ChangeLog
