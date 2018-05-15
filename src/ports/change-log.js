//@flow
import uuidv5 from 'uuid/v5'
import TransactionManager from './transaction-manager'
import { sort } from '../utils'

import type { ChangelogInterface, ChangeRecord, QueueMessage, Identifier, QueueAdapterInterface, Observer } from '../flowtypes'

const sign = (id: Identifier, payload: ChangeRecord): Identifier => {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID')
  }

  const versionId = uuidv5(JSON.stringify(payload), id)

  return versionId
}

class ChangeLog implements ChangelogInterface {
  transactionManager: Object
  topic: string
  adapter: QueueAdapterInterface
  latest: { [Identifier]: ChangeRecord }
  versions: { [Identifier]: ChangeRecord }

  constructor(config: Object = {}) {
    this.adapter = config.adapter
    this.topic = config.topic

    this.latest = {}
    this.versions = {}
    this.transactionManager = new TransactionManager({
      queue: this.adapter,
      commitTopic: this.topic,
      onCommit: payload => this.registerAsLatest(payload)
    })
  }

  registerAsLatest(payload: ChangeRecord) {
    this.versions[payload.version_id] = payload
    this.latest[payload.id] = payload
  }

  getVersion(versionId: Identifier) {
    return this.versions[versionId]
  }

  getLatestVersion(id: Identifier) {
    return this.latest[id]
  }

  async reconstruct() {
    this.latest = {}
    this.versions = {}
    let log = await this.adapter.getLog(this.topic)
    log = sort(log, 'version')

    for (let record of log) {
      this.registerAsLatest(record)
    }

    return log
  }

  logChange(id: Identifier, payload: Object) {
    const previous = this.getLatestVersion(id)
    if (!previous) {
      throw new Error('[ChangeLog] Cannot create new version because the previous one does not exist')
    }

    const versionId = sign(id, payload)
    if (previous.version_id === versionId) {
      throw new Error('[ChangeLog] Cannot create new version because it is not different from the current one')
    }

    const versionNumber = previous.version + 1
    const now = new Date()

    const document = {
      id,
      type: previous.type,
      created_at: previous.created_at,
      version: versionNumber,
      modified_at: now.toISOString(),
      version_id: versionId,
      payload
    }

    return this.transactionManager.execute(this.topic, document)
  }

  logNew(type: string, id: Identifier, payload: Object) {
    const now = new Date()
    const versionId = sign(id, payload)
    const document = {
      id,
      type,
      created_at: now.toISOString(),
      version: 1,
      modified_at: now.toISOString(),
      version_id: versionId,
      payload
    }

    return this.transactionManager.execute(this.topic, document)
  }

  observe(func: Observer) {
    this.adapter.on(this.topic, func)
  }
}

export default ChangeLog
