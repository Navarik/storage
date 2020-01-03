import { ChangelogAdapter, SignatureProvider, TransactionManager, Observer, Entity, SignedEntity } from '../types'

type ChangelogConfig = {
  adapter: ChangelogAdapter<Entity>
  signatureProvider: SignatureProvider
  transactionManager: TransactionManager
}

export class ChangeLog {
  private adapter: ChangelogAdapter<Entity>
  private signatureProvider: SignatureProvider
  private transactionManager: TransactionManager
  private observer: Observer<Entity>|null

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

  onChange(observer: Observer<Entity>) {
    this.observer = observer
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  reconstruct(topics: Array<string>) {
    return this.adapter.init(topics)
  }

  async registerNew(entity: Entity) {
    const now = new Date()
    const firstVersion = this.signatureProvider.signNew({
      ...entity,
      created_at: now.toISOString(),
      modified_at: now.toISOString()
    })

    const transaction = this.transactionManager.start(firstVersion.version_id)
    await this.adapter.write(firstVersion)

    return transaction.promise
  }

  async registerUpdate(entity: SignedEntity) {
    const now = new Date()
    const newVersion = this.signatureProvider.signVersion({
      ...entity,
      modified_at: now.toISOString()
    })

    if (entity.version_id === newVersion.version_id) {
      return entity
    }

    const transaction = this.transactionManager.start(newVersion.version_id)
    await this.adapter.write(newVersion)

    return transaction.promise
  }
}
