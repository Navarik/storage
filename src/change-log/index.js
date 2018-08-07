import arraySort from 'array-sort'
import SignatureProvider from './signature-provider'
import createChangelogAdapter from './changelog-adapter-factory'

class ChangeLog {
  constructor({ type, content, idGenerator, transactionManager }) {
    this.adapter = createChangelogAdapter(type, content)
    this.signature = new SignatureProvider(idGenerator)
    this.transactionManager = transactionManager
  }

  onChange(type, func) {
    this.adapter.on(type, async (record) => {
      const result = await func(record)
      this.transactionManager.commit(record.version_id, result)
    })
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  async reconstruct(topic) {
    await this.adapter.init()
    let log = await this.adapter.read(topic)
    log = log.map(record => (record.id ? record : this.signature.signNew(record)))
    log = arraySort(log, 'version')

    return log
  }

  async registerNew(type, document) {
    const record = this.signature.signNew(document)

    const transaction = this.transactionManager.start(record.version_id)
    await this.adapter.write(type, record)

    return transaction.promise
  }

  async registerUpdate(type, oldVersion, document) {
    const newVersion = this.signature.signVersion(document, oldVersion)
    if (oldVersion.version_id === newVersion.version_id) {
      return previous
    }

    const transaction = this.transactionManager.start(newVersion.version_id)
    this.adapter.write(type, newVersion)

    return transaction.promise
  }
}

export default ChangeLog
