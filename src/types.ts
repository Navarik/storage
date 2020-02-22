import { Dictionary, Document } from '@navarik/types'
import { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity } from '@navarik/core-ddl'

export type Timestamp = string
export type UUID = string

export interface CanonicalEntity {
  id: UUID
  version_id: UUID
  parent_id: UUID|null
  created_at: Timestamp
  modified_at: Timestamp
  type: string
  body: Document
  schema: UUID
}

export type IdGenerator = (body: Document) => UUID

export interface TransactionManager {
  commit(key: string): void
  reject(key: string, message: any): void
  start(key: string, body: CanonicalEntity): Promise<CanonicalEntity>
}

export type ActionType = 'create'|'update'|'delete'|'cast'

export interface ChangeEvent {
  action: ActionType
  timestamp: Timestamp
  entity: CanonicalEntity
  schema: CanonicalSchema|undefined
  parent: CanonicalEntity|undefined
}

export type Observer = (event: ChangeEvent) => void|Promise<void>

export interface Changelog {
  observe(handler: Observer): void
  write(message: ChangeEvent): Promise<void>
  reset(): Promise<void>
  up(): Promise<void>
  down(): Promise<void>
  isHealthy(): Promise<boolean>
}

export type SearchQuery = Dictionary<string>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndex<T extends CanonicalEntity> {
  index(document: T, schema?: CanonicalSchema): Promise<void>
  update(document: T, schema?: CanonicalSchema): Promise<void>
  delete(document: T, schema?: CanonicalSchema): Promise<void>
  find(query: SearchQuery, options: SearchOptions): Promise<Array<T>>
  count(query: SearchQuery): Promise<number>
  up(): Promise<void>
  down(): Promise<void>
  isHealthy(): Promise<boolean>
  isClean(): Promise<boolean>
}

export { Document, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity }
