import { Dictionary, Document, Service, EventLog } from '@navarik/types'
import { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity } from '@navarik/core-ddl'

export type Timestamp = string
export type UUID = string

export interface CanonicalEntity<B extends Document, M extends Document> {
  id: UUID
  version_id: UUID
  parent_id: UUID|null
  modified_by: UUID
  modified_at: Timestamp
  type: string
  body: B
  meta: M
  schema: UUID
}

export type EntityData<B extends Document, M extends Document> = Partial<CanonicalEntity<B, M>> & {
  id?: UUID
  type: string
  body: Document
  meta: Document
}

export type PartialEntity<B extends Document, M extends Document> = Partial<CanonicalEntity<B, M>> & {
  id?: UUID
  type?: string
  body: Document
  meta?: Document
}

export type IdGenerator = (body: Document) => UUID

export type ActionType = 'create'|'update'|'delete'

export interface ChangeEvent<B extends Document, M extends Document> {
  action: ActionType
  user: UUID
  timestamp: Timestamp
  message: string
  entity: CanonicalEntity<B, M>
  schema: CanonicalSchema|undefined
  parent: CanonicalEntity<B, M>|undefined
}

export type AccessType = 'read'|'write'

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

export interface AccessControlAdapter<B extends Document, M extends Document> {
  check(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision>
  attachTerms(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>>
  getQuery(subject: UUID, access: AccessType): Promise<SearchQuery>
}

export type Observer<B extends Document, M extends Document> = (event: ChangeEvent<B, M>) => void|Promise<void>

export interface Changelog<B extends Document, M extends Document> extends EventLog<ChangeEvent<B, M>> {}

export interface State<B extends Document, M extends Document> extends Service {
  put(document: CanonicalEntity<B, M>): Promise<void>
  get(id: string): Promise<CanonicalEntity<B, M>>
  delete(id: string): Promise<void>
}

export type SearchQuery = Dictionary<string|object|number|boolean>
export type SearchOptions = {
  limit?: number
  offset?: number
  sort?: string|Array<string>
}

export interface SearchIndex<B extends Document, M extends Document> extends Service {
  update(action: ActionType, document: CanonicalEntity<B, M>, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  find(query: SearchQuery, options: SearchOptions): Promise<Array<CanonicalEntity<B, M>>>
  count(query: SearchQuery): Promise<number>
  isClean(): Promise<boolean>
}

export { Document, SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, FormattedEntity }
