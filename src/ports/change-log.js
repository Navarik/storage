//@flow
import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

import type { IdGenerator, ChangelogInterface, ChangeRecord, Identifier, ChangelogAdapterInterface, Observer } from '../flowtypes'

type GenericChangeRecord = ChangeRecord<any>

const signVersion = (id: Identifier, body: GenericChangeRecord): Identifier => {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID')
  }

  const versionId = uuidv5(JSON.stringify(body), id)

  return versionId
}

class ChangeLog implements ChangelogInterface {
  topic: string
  generateId: IdGenerator
  adapter: ChangelogAdapterInterface
  latest: { [Identifier]: GenericChangeRecord }
  versions: { [Identifier]: GenericChangeRecord }

  constructor(topic: string, adapter: ChangelogAdapterInterface, generator: IdGenerator) {
    this.adapter = adapter
    this.topic = topic
    this.generateId = generator

    this.latest = {}
    this.versions = {}
  }

  registerAsLatest(document: GenericChangeRecord) {
    this.versions[document.version_id] = document
    this.latest[document.id] = document
  }

  async register(document: GenericChangeRecord): Promise<GenericChangeRecord> {
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

  createNewDocument(body: any) {
    const now = new Date()
    const id = this.generateId(body)
    const versionId = signVersion(id, body)
    const document = {
      id,
      created_at: now.toISOString(),
      version: 1,
      modified_at: now.toISOString(),
      version_id: versionId,
      body
    }

    return document
  }

  async reconstruct() {
    this.latest = {}
    this.versions = {}

    let log = await this.adapter.read(this.topic)
    log = arraySort(log, 'version')
    log = log.map(record => (record.id ? record : this.createNewDocument(record)))

    for (let record of log) {
      this.registerAsLatest(record)
    }

    return log
  }

  logChange(id: Identifier, body: any) {
    const previous = this.getLatestVersion(id)
    if (!previous) {
      throw new Error('[ChangeLog] Cannot create new version because the previous one does not exist')
    }

    const versionId = signVersion(id, body)
    if (previous.version_id === versionId) {
      throw new Error('[ChangeLog] Cannot create new version because it is not different from the current one')
    }

    const versionNumber = previous.version + 1
    const now = new Date()

    const document = {
      id,
      created_at: previous.created_at,
      version: versionNumber,
      modified_at: now.toISOString(),
      version_id: versionId,
      body
    }

    return this.register(document)
  }

  logNew(body: any) {
    return this.register(this.createNewDocument(body))
  }
}

export default ChangeLog
