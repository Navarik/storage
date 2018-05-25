//@flow
import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

import type { ChangelogInterface, ChangeRecord, QueueMessage, Identifier, QueueAdapterInterface, Observer, Collection } from '../flowtypes'

const sign = (id: Identifier, body: ChangeRecord): Identifier => {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID')
  }

  const versionId = uuidv5(JSON.stringify(body), id)

  return versionId
}

class ChangeLog implements ChangelogInterface {
  topic: string
  adapter: QueueAdapterInterface
  latest: { [Identifier]: ChangeRecord }
  versions: { [Identifier]: ChangeRecord }

  constructor(config: Object = {}) {
    this.adapter = config.adapter
    this.topic = config.topic

    this.latest = {}
    this.versions = {}
  }

  registerAsLatest(document: ChangeRecord) {
    this.versions[document.version_id] = document
    this.latest[document.id] = document
  }

  async register(document: Object): Promise<Object> {
    await this.adapter.send(this.topic, document)
    this.registerAsLatest(document)

    return document
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
    log = arraySort(log, 'version')

    for (let record of log) {
      this.registerAsLatest(record)
    }

    return log
  }

  logChange(id: Identifier, body: Object) {
    const previous = this.getLatestVersion(id)
    if (!previous) {
      throw new Error('[ChangeLog] Cannot create new version because the previous one does not exist')
    }

    const versionId = sign(id, body)
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
      body
    }

    return this.register(document)
  }

  logNew(type: string, id: Identifier, body: Object) {
    const now = new Date()
    const versionId = sign(id, body)
    const document = {
      id,
      type,
      created_at: now.toISOString(),
      version: 1,
      modified_at: now.toISOString(),
      version_id: versionId,
      body
    }

    return this.register(document)
  }

  observe(func: Observer) {
    this.adapter.on(this.topic, func)
  }
}

export default ChangeLog