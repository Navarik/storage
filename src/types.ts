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
  meta: Document
  schema: UUID
}

export type TypedEntity = Partial<CanonicalEntity> & {
  type: string
  body: Document
  meta?: Document
}

export type IdentifiedEntity = Partial<CanonicalEntity> & {
  id: UUID
  body: Document
  meta?: Document
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

interface Service {
  up(): Promise<void>
  down(): Promise<void>
  isHealthy(): Promise<boolean>
}

export interface Changelog extends Service {
  observe(handler: Observer): void
  write(message: ChangeEvent): Promise<void>
  reset(): Promise<void>
}

export interface State<T extends CanonicalEntity> extends Service {
  put(document: T): Promise<void>
  get(id: string): Promise<T>
  delete(id: string): Promise<void>
}

export type SearchQuery = Dictionary<string>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndex<T extends CanonicalEntity> extends Service {
  index(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  update(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  delete(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  find(query: SearchQuery, options: SearchOptions): Promise<Array<T>>
  count(query: SearchQuery): Promise<number>
  isClean(): Promise<boolean>
}

export { Document, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity }
