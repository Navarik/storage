import { Logger } from '@navarik/types'
import { TransactionManager } from "@navarik/transaction-manager"
import { v4 as uuidv4 } from 'uuid'
import LRU from "lru-cache"
import { ChangelogAdapter, CanonicalEntity, ChangeEvent, EntityEnvelope, ActionType, CanonicalSchema } from './types'
import { Entity } from './entity'

interface ChangelogConfig<M extends object> {
  adapter: ChangelogAdapter<M>
  logger: Logger
  cacheSize: number
  observer: (change: CanonicalEntity<any, M>, schema: CanonicalSchema) => Promise<void>
}

export class Changelog<M extends object> {
  private adapter: ChangelogAdapter<M>
  private observer: (change: CanonicalEntity<any, M>, schema: CanonicalSchema) => Promise<void>
  private transactionManager: TransactionManager
  private logger: Logger
  private cache: LRU<string, CanonicalEntity<any, M>>
  private healthStats = {
    totalChangesProduced: 0,
    totalChangesReceived: 0,
    totalProcessingErrors: 0
  }

  constructor({ observer, adapter, logger, cacheSize }: ChangelogConfig<M>) {
    this.logger = logger
    this.adapter = adapter
    this.observer = observer
    this.transactionManager = new TransactionManager()
    this.adapter.observe(x => this.onChange(x))
    this.cache = new LRU({
      max: cacheSize
    })
  }

  private async onChange<B extends object>({ id, action, entity, schema }: ChangeEvent<B, M>) {
    this.healthStats.totalChangesReceived++

    try {
      this.logger.debug({ component: "Storage" }, `Received change event for entity: ${entity.id}`)

      if (this.cache.has(id)) { 
        return 
      }

      // This makes Storage compatible with older CanonicalEntity type without the `last_action` field
      if (!entity.last_action) {
        entity.last_action = action
      }

      await this.observer(entity, schema)

      this.transactionManager.commit(id, new Entity(entity).envelope())
      this.cache.set(id, entity)
      
    } catch (error: any) {
      this.healthStats.totalProcessingErrors++
      this.logger.error({ component: "Storage", stack: error.stack }, `Error processing change event: ${error.message}`)

      this.transactionManager.reject(id, error)
    }
  }

  async requestChange<B extends object>(action: ActionType, entity: CanonicalEntity<B, M>, schema: CanonicalSchema) {
    const id = uuidv4()

    const transaction = this.transactionManager.start(id, 1)
    await this.adapter.write({ id, action, entity, schema })

    this.healthStats.totalChangesProduced++

    return <Promise<EntityEnvelope>>transaction
  }

  async readAll() {
    await this.adapter.readAll()
  }

  async up() {
    await this.adapter.up()
  }

  async down() {
    await this.adapter.down()
    this.cache.clear()
  }

  async isHealthy() {
    return this.adapter.isHealthy()
  }

  async stats() {
    return {
      ...this.healthStats,
      changelog: this.adapter.stats && (await this.adapter.stats())
    }
  }
}
