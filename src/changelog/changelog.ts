import { ChangelogAdapter, SignatureProvider, TransactionManager, EntityBody, CanonicalEntity, PubSub, Observer } from '../types'

type ChangelogConfig = {
  adapter: ChangelogAdapter
  signatureProvider: SignatureProvider
  transactionManager: TransactionManager
}

export class ChangeLog {
  private adapter: ChangelogAdapter
  private signatureProvider: SignatureProvider
  private transactionManager: TransactionManager
  private observer: Observer<CanonicalEntity>|null

  constructor({ adapter, signatureProvider, transactionManager }: ChangelogConfig) {
    this.adapter = adapter
    this.signatureProvider = signatureProvider
    this.transactionManager = transactionManager
    this.observer = null

    this.adapter.observe(async (record) => {
      if (this.observer) {
        await this.observer(record)
      }

      this.transactionManager.commit(record.version_id, record)
    })
  }

  onChange(observer: Observer<CanonicalEntity>) {
    this.observer = observer
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
