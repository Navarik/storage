//@flow
import uuidv5 from 'uuid/v5'
import TransactionManager from './transaction-manager'
import { sort } from '../utils'

import type { IdGenerator, ChangelogInterface, ChangeRecord, QueueMessage, Identifier, QueueAdapterInterface, Observer } from '../flowtypes'

type ChangeLogConfiguration = {
  topic: string,
  idGenerator: IdGenerator,
  queue: QueueAdapterInterface
}

class ChangeLog implements ChangelogInterface {
  transactionManager: Object
  topic: string
  idGenerator: IdGenerator
  queue: QueueAdapterInterface
  versions: { [Identifier]: ChangeRecord }

  constructor(config: Object = {}) {
    this.queue = config.queue
    this.idGenerator = config.idGenerator
    this.topic = config.topic

    this.versions = {}
    this.transactionManager = new TransactionManager({
      queue: this.queue,
      commitTopic: this.topic,
      onCommit: payload => this.registerAsLatest(payload)
    })
  }

  registerAsLatest(payload: ChangeRecord) {
    this.versions[payload.id] = payload
  }

  getLatestVersion(id: Identifier) {
    return this.versions[id]
  }

  getLatestVersionNumber(id: Identifier) {
    return this.versions[id] ? this.versions[id].version : 0
  }

  async reconstruct() {
    let log = await this.queue.getLog(this.topic)
    log = sort(log, 'version')

    for (let record of log) {
      this.registerAsLatest(record)
    }

    return { log, latest: Object.values(this.versions) }
  }

  sign(document: QueueMessage): ChangeRecord {
    if (!document.id) {
      throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID')
    }

    const version = this.getLatestVersionNumber(document.id) + 1
    const now = new Date()
    const signedDocument = {
      ...document,
      version,
      modified_at: now.toISOString(),
      version_id: uuidv5(JSON.stringify(document.payload), document.id)
    }

    return signedDocument
  }

  logChange(id: Identifier, payload: Object) {
    const previous = this.getLatestVersion(id)
    const document = this.sign({
      ...previous,
      payload
    })

    return this.transactionManager.execute(this.topic, document)
  }

  logNew(type: string, payload: Object) {
    const now = new Date()
    const document = this.sign({
      id: this.idGenerator(payload),
      created_at: now.toISOString(),
      type,
      payload
    })

    return this.transactionManager.execute(this.topic, document)
  }

  observe(func: Observer) {
    this.queue.on(this.topic, func)
  }
}

export default ChangeLog
