import { Dictionary, Logger, Service } from '@navarik/types'
import { CanonicalSchema, ValidationResponse, FormattedEntity, SchemaRegistryAdapter, SchemaField } from '@navarik/core-ddl'

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

export interface StorageConfig<M extends object> {
  // Adapters - override when changing underlying technology
  changelog?: ChangelogAdapter<M>
  index?: SearchIndex<M>

  // Extensions - override when adding new rules/capacities
  schemaRegistry?: SchemaRegistryAdapter
  accessControl?: AccessControlAdapter<M>
  logger?: Logger

  // Built-in schemas for entity body and metadata
  meta?: Dictionary<SchemaField>
  schema?: Array<CanonicalSchema>

  // Built-in entities if any
  data?: Array<EntityData<any, M>>

  // Configuration
  cacheSize?: number
}

export interface StorageInterface<MetaType extends object> extends Service {
  stats(): Promise<object>
  types(): Array<string>
  describe(type: string): CanonicalSchema|undefined
  define(schema: CanonicalSchema): void
  has(id: UUID): Promise<boolean>
  get<BodyType extends object>(id: UUID, user?: UUID): Promise<CanonicalEntity<BodyType, MetaType> | undefined>
  find<BodyType extends object>(query?: SearchQuery, options?: SearchOptions, user?: UUID): Promise<Array<CanonicalEntity<BodyType, MetaType>>>
  count(query?: SearchQuery, user?: UUID): Promise<number>
  validate<BodyType extends object>(entity: EntityData<BodyType, MetaType>): ValidationResponse
  create<BodyType extends object>(data: EntityData<BodyType, MetaType>, commitMessage?: string, user?: UUID): Promise<CanonicalEntity<BodyType, MetaType>>
  update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, commitMessage?: string , user?: UUID): Promise<CanonicalEntity<BodyType, MetaType>>
  delete<BodyType extends object>(id: UUID, commitMessage?: string, user?: UUID): Promise<CanonicalEntity<BodyType, MetaType> | undefined>
  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>): void
}

export { CanonicalSchema, ValidationResponse, FormattedEntity, SchemaRegistryAdapter }
