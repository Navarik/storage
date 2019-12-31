import { SignatureProvider } from './signature-provider'
import { createChangelogAdapter } from './changelog-adapter-factory'

export class ChangeLog {
  private adapter
  private signatureProvider
  private transactionManager

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
    const record = this.signatureProvider.signNew(type, document)

    const transaction = this.transactionManager.start(record.version_id)
    await this.adapter.write(record)

    return transaction.promise
  }

  async registerUpdate(type, oldVersion, document) {
    const newVersion = this.signatureProvider.signVersion(type, document, oldVersion)
    if (oldVersion.version_id === newVersion.version_id) {
      return oldVersion
    }

    const transaction = this.transactionManager.start(newVersion.version_id)
    await this.adapter.write(newVersion)

    return transaction.promise
  }
}
