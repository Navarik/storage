import { ChangelogAdapter, SignatureProvider, TransactionManager, EntityBody, CanonicalEntity } from '../types'

export class ChangeLog {
  private adapter: ChangelogAdapter
  private signatureProvider: SignatureProvider
  private transactionManager: TransactionManager

  constructor({ adapter, signatureProvider, transactionManager }) {
    this.adapter = adapter
    this.signatureProvider = signatureProvider
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

  reconstruct(topics: Array<string>) {
    return this.adapter.init(topics)
  }

  async registerNew(type: string, document: EntityBody) {
    const record = this.signatureProvider.signNew(type, document)

    const transaction = this.transactionManager.start(record.version_id)
    await this.adapter.write(record)

    return transaction.promise
  }

  async registerUpdate(type: string, oldVersion: CanonicalEntity, document: EntityBody) {
    const newVersion = this.signatureProvider.signVersion(type, document, oldVersion)
    if (oldVersion.version_id === newVersion.version_id) {
      return oldVersion
    }

    const transaction = this.transactionManager.start(newVersion.version_id)
    await this.adapter.write(newVersion)

    return transaction.promise
  }
}
