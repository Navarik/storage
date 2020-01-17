import { ChangelogAdapter, TransactionManager, Observer, CanonicalEntity } from '../types'

type ChangelogConfig = {
  adapter: ChangelogAdapter
  transactionManager: TransactionManager
}

export class ChangeLog {
  private adapter: ChangelogAdapter
  private transactionManager: TransactionManager
  private observer: Observer|null

  constructor({ adapter, transactionManager }: ChangelogConfig) {
    this.adapter = adapter
    this.transactionManager = transactionManager
    this.observer = null

    this.adapter.observe(async (changeEvent) => {
      if (this.observer) {
        await this.observer(changeEvent)
      }

      this.transactionManager.commit(changeEvent.entity.version_id)
    })
  }

  onChange(observer: Observer) {
    this.observer = observer
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  init() {
    return this.adapter.init()
  }

  reconstruct() {
    return this.adapter.reset()
  }

  async registerNew(entity: CanonicalEntity) {
    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = {
      action: 'create',
      entity,
      parent: null,
      timestamp: entity.modified_at
    }
    await this.adapter.write(changeEvent)

    return transaction
  }

  async registerUpdate(entity: CanonicalEntity, previous: CanonicalEntity) {
    if (entity.version_id === previous.version_id) {
      return entity
    }

    const transaction = this.transactionManager.start(entity.version_id, entity)
    const changeEvent = {
      action: 'update',
      entity,
      parent: previous.version_id,
      timestamp: entity.modified_at
    }
    await this.adapter.write(changeEvent)

    return transaction
  }
}
