import { Logger } from '@navarik/types'
import { TransactionManager } from "@navarik/transaction-manager"
import { AccessControlAdapter, ChangelogAdapter, CanonicalEntity, ChangeEvent } from './types'
import { AccessError } from './errors/access-error'

interface ChangelogConfig<M extends object> {
  adapter: ChangelogAdapter<M>
  logger: Logger
  observer: (change: ChangeEvent<any, M>) => Promise<void>
  accessControl: AccessControlAdapter<M>
}

export class Changelog<MetaType extends object> {
  private adapter: ChangelogAdapter<MetaType>
  private observer: (change: ChangeEvent<any, MetaType>) => Promise<void>
  private accessControl: AccessControlAdapter<MetaType>
  private transactionManager: TransactionManager<CanonicalEntity<any, MetaType>>
  private logger: Logger
  private healthStats = {
    totalChangesProduced: 0,
    totalChangesReceived: 0,
    totalProcessingErrors: 0
  }

  constructor({ observer, adapter, accessControl, logger }: ChangelogConfig<MetaType>) {
    this.logger = logger
    this.adapter = adapter
    this.observer = observer
    this.accessControl = accessControl
    this.transactionManager = new TransactionManager()
    this.adapter.observe(x => this.onChange(x))
  }

  private async onChange<B extends object>(event: ChangeEvent<B, MetaType>) {
    this.healthStats.totalChangesReceived++

    try {
      this.logger.debug({ component: "Storage" }, `Received change event for entity: ${event.entity.id}`)
      await this.observer(event)

      if (!this.transactionManager.commit(event.id, event.entity)) {
        this.logger.debug({ component: "Storage" }, `Can't find transaction ${event.id}`)
      }
    } catch (error: any) {
      this.healthStats.totalProcessingErrors++
      this.logger.error({ component: "Storage", stack: error.stack }, `Error processing change event: ${error.message}`)

      if (!this.transactionManager.reject(event.id, error)) {
        this.logger.debug({ component: "Storage" }, `Can't find transaction ${event.id}`)
      }
    }
  }

  async requestChange<B extends object>(change: ChangeEvent<B, MetaType>) {
    const access = await this.accessControl.check(change.user, 'write', change.entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    const transaction = this.transactionManager.start(change.id, 1)
    await this.adapter.write(change)

    this.healthStats.totalChangesProduced++

    return <Promise<CanonicalEntity<B, MetaType>>>transaction
  }

  async readAll() {
    await this.adapter.readAll()
  }

  async up() {
    await this.adapter.up()
  }

  async down() {
    await this.adapter.down()
  }

  async isHealthy() {
    return this.adapter.isHealthy()
  }

  async stats() {
    return {
      ...this.healthStats,
      changelog: await this.adapter.stats()
    }
  }
}
