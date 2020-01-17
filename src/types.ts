import { Dictionary, Document } from '@navarik/types'
import { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity } from '@navarik/core-ddl'

export type Timestamp = string
export type UUID = string

export interface CanonicalEntity {
  id: UUID
  version_id: UUID
  created_at: Timestamp
  modified_at: Timestamp
  type: string
  body: Document
  schema: UUID
}

export type IdGenerator = (body: Document) => UUID

export interface EntityFactory {
  create(entity: FormattedEntity): CanonicalEntity
  createVersion(current: FormattedEntity, previous: CanonicalEntity): CanonicalEntity
}

export interface TransactionManager {
  commit(key: string): void
  reject(key: string, message: any): void
  start(key: string, body: CanonicalEntity): Promise<CanonicalEntity>
}

export interface ChangeEvent {
  action: string
  timestamp: Timestamp
  entity: CanonicalEntity
  parent: UUID|null
}

export type Observer = (event: ChangeEvent) => void|Promise<void>

export interface ChangelogAdapter {
  observe(handler: Observer): void
  write(message: ChangeEvent): Promise<void>
  reset(): Promise<void>
  init(): Promise<void>
  isConnected(): boolean
}

export type SearchQuery = Dictionary<string>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndexAdapter {
  index(document: CanonicalEntity): Promise<void>
  find(query: SearchQuery, options: SearchOptions): Promise<Array<CanonicalEntity>>
  count(query: SearchQuery): Promise<number>
  init(): Promise<void>
  isConnected(): boolean
  isClean(): Promise<boolean>
}

export { Document, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity }
