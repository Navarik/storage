import arraySort from 'array-sort'
import SignatureProvider from './signature-provider'
import createChangelogAdapter from './changelog-adapter-factory'

class ChangeLog {
  constructor({ type, content, idGenerator, transactionManager }) {
    this.adapter = createChangelogAdapter(type, content)
    this.signatureProvider = new SignatureProvider(idGenerator)
    this.transactionManager = transactionManager
  }

  onChange(func) {
    this.adapter.observe(async (record) => {
      const result = await func(record)
      return this.transactionManager.commit(record.version_id, result)
    })
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  reconstruct(topics) {
    return this.adapter.init(topics, this.signatureProvider)
  }

  async registerNew(type, document) {
    const record = this.signatureProvider.signNew(document)

    const transaction = this.transactionManager.start(record.version_id)
    await this.adapter.write(type, record)

    return transaction.promise
  }

  async registerUpdate(type, oldVersion, document) {
    const newVersion = this.signatureProvider.signVersion(document, oldVersion)
    if (oldVersion.version_id === newVersion.version_id) {
      return previous
    }

    const transaction = this.transactionManager.start(newVersion.version_id)
    this.adapter.write(type, newVersion)

    return transaction.promise
  }
}

export default ChangeLog
