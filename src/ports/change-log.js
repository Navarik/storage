//@flow
import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

import type { ChangelogInterface, ChangeRecord, Identifier, ChangelogAdapterInterface, Observer } from '../flowtypes'

const sign = (id: Identifier, body: ChangeRecord): Identifier => {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID')
  }

  const versionId = uuidv5(JSON.stringify(body), id)

  return versionId
}

class ChangeLog implements ChangelogInterface {
  topic: string
  adapter: ChangelogAdapterInterface
  latest: { [Identifier]: ChangeRecord }
  versions: { [Identifier]: ChangeRecord }

  constructor(topic: string, adapter: ChangelogAdapterInterface) {
    this.adapter = adapter
    this.topic = topic

    this.latest = {}
    this.versions = {}
  }

  registerAsLatest(document: ChangeRecord) {
    this.versions[document.version_id] = document
    this.latest[document.id] = document
  }

  async register(document: ChangeRecord): Promise<ChangeRecord> {
    await this.adapter.write(this.topic, document)
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

    let log = await this.adapter.read(this.topic)
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
      type: this.topic,
      created_at: previous.created_at,
      version: versionNumber,
      modified_at: now.toISOString(),
      version_id: versionId,
      body
    }

    return this.register(document)
  }

  logNew(id: Identifier, body: Object) {
    const now = new Date()
    const versionId = sign(id, body)
    const document = {
      id,
      type: this.topic,
      created_at: now.toISOString(),
      version: 1,
      modified_at: now.toISOString(),
      version_id: versionId,
      body
    }

    return this.register(document)
  }
}

export default ChangeLog
