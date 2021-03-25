import { Dictionary, Service } from '@navarik/types'
import { CanonicalSchema, ValidationResponse, FormattedEntity, SchemaRegistryAdapter } from '@navarik/core-ddl'

export type Timestamp = string
export type UUID = string

export interface CanonicalEntity<B extends object, M extends object> {
  id: UUID
  version_id: UUID
  previous_version_id: UUID|null
  created_by: UUID
  created_at: Timestamp
  modified_by: UUID
  modified_at: Timestamp
  type: string
  body: B
  meta: M
  schema: UUID
}

export type EntityData<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
  type: string
  body: B
}

export type EntityPatch<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
  id: UUID
  body: B
  version_id: UUID
}

export type ActionType = 'create'|'update'|'delete'

export interface ChangeEvent<B extends object, M extends object> {
  id: UUID
  action: ActionType
  user: UUID
  timestamp: Timestamp
  message: string
  entity: CanonicalEntity<B, M>
  schema: CanonicalSchema|undefined
  parent: CanonicalEntity<B, M>|undefined
}

export type AccessType = 'read'|'write'|'search'

export type AccessGrant = {
  subject: UUID
  access: AccessType
}

export type AccessControlQueryTerms = {
  dac: Array<AccessGrant>
  mac: Array<UUID>
}

export type AccessControlDecision = {
  granted: boolean
  explanation: string
}

export interface AccessControlAdapter<M extends object> {
  check<B extends object>(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision>
  attachTerms<B extends object>(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>>
  getQuery(subject: UUID, access: AccessType): Promise<SearchQuery>
}

export type Observer<B extends object, M extends object> = (event: ChangeEvent<B, M>) => void|Promise<void>

export interface ChangelogAdapter<M extends object> extends Service {
  observe(handler: <B extends object>(event: ChangeEvent<B, M>) => void|Promise<void>): void
  write<B extends object>(message: ChangeEvent<B, M>): Promise<void>
  readAll(): Promise<void>
}

export type SearchQuery = Dictionary<string|object|number|boolean>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndex<M extends object> extends Service {
  update<B extends object>(action: ActionType, document: CanonicalEntity<B, M>, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  find<B extends object>(query: SearchQuery, options: SearchOptions): Promise<Array<CanonicalEntity<B, M>>>
  count(query: SearchQuery): Promise<number>
  isClean(): Promise<boolean>
}

export { CanonicalSchema, ValidationResponse, FormattedEntity, SchemaRegistryAdapter }
