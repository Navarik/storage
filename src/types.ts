import { Dictionary, Document } from '@navarik/types'
import { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity } from '@navarik/core-ddl'

export type Timestamp = string
export type UUID = string

export interface CanonicalEntity {
  id: UUID
  version_id: UUID
  parent_id: UUID|null
  created_by: UUID
  created_at: Timestamp
  modified_by: UUID
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

export type AccessType = 'read' | 'write'

export type AccessGrant = {
  subject: UUID
  access: AccessType
}

export type AccessControlList = {
  container: UUID
  dac: Array<AccessGrant>
  mac: Array<UUID>
}

export type AccessControlQueryTerms = {
  dac: Array<AccessGrant>
  mac: Array<UUID>
}

export type AccessControlDecision = {
  granted: boolean
  explain: () => string
}

export interface AccessControlAdapter<T> {
  check(subject: UUID, action: AccessType, object: T): AccessControlDecision
  createAcl(entity:T): Promise<any>
  getQueryTerms(subject:UUID, access:AccessType): Promise<AccessControlQueryTerms>
}

export interface Changelog extends Service {
  observe(handler: Observer): void
  write(message: ChangeEvent): Promise<void>
  reset(): Promise<void>
}

export interface State<T extends CanonicalEntity> extends Service {
  put(document: T): Promise<void>
  get(id: string, user?: UUID): Promise<T>
  delete(id: string): Promise<void>
}

export type SearchQuery = Dictionary<string|object|number|boolean>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndex<T extends CanonicalEntity> extends Service {
  index(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  update(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  delete(document: T, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  find(user: UUID, query: SearchQuery, options: SearchOptions): Promise<Array<T>>
  count(user: UUID, query: SearchQuery): Promise<number>
  isClean(): Promise<boolean>
}

export { Document, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity }
