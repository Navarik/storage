import { Logger } from '@navarik/types'
import { TransactionManager } from "@navarik/transaction-manager"
import { v4 as uuidv4 } from 'uuid'
import { ChangelogAdapter, CanonicalEntity, ChangeEvent, EntityEnvelope, ActionType, CanonicalSchema } from '../types'

import { entityEnvelope } from './entity-envelope'

interface ChangelogConfig<M extends object> {
  adapter: ChangelogAdapter<M>
  logger: Logger
  observer: (change: ChangeEvent<any, M>) => Promise<void>
}

export class Changelog<M extends object> {
  private adapter: ChangelogAdapter<M>
  private observer: (change: ChangeEvent<any, M>) => Promise<void>
  private transactionManager: TransactionManager<CanonicalEntity<any, M>>
  private logger: Logger
  private healthStats = {
    totalChangesProduced: 0,
    totalChangesReceived: 0,
    totalProcessingErrors: 0
  }

  constructor({ observer, adapter, logger }: ChangelogConfig<M>) {
    this.logger = logger
    this.adapter = adapter
    this.observer = observer
    this.transactionManager = new TransactionManager()
    this.adapter.observe(x => this.onChange(x))
  }

  private async onChange<B extends object>(event: ChangeEvent<B, M>) {
    this.healthStats.totalChangesReceived++

    try {
      this.logger.debug({ component: "Storage" }, `Received change event for entity: ${event.entity.id}`)
      await this.observer(event)

      const envelope = entityEnvelope(event.entity)

      if (!this.transactionManager.commit(event.id, envelope)) {
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

  async requestChange<B extends object>(action: ActionType, entity: CanonicalEntity<B, M>, schema: CanonicalSchema) {
    const id = uuidv4()

    const transaction = this.transactionManager.start(id, 1)
    await this.adapter.write({ id, action, entity, schema })

    this.healthStats.totalChangesProduced++

    return <Promise<EntityEnvelope<B, M>>>transaction
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
