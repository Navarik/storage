import { Dictionary, Logger, Service } from '@navarik/types'

export type Timestamp = string
export type UUID = string

export interface SchemaField<P = Dictionary<any>> {
  name: string
  type: string
  parameters?: P
  required?: boolean
  default?: any
}

export interface CanonicalSchema {
  name: string;
  fields: Array<SchemaField>
}

export type ActionType = 'create'|'update'|'delete'

export interface EntityEnvelope {
  id: UUID
  version_id: UUID
  previous_version_id: UUID|null
  last_action: ActionType
  created_by: UUID
  created_at: Timestamp
  modified_by: UUID
  modified_at: Timestamp
  type: string
  schema: UUID
}

export interface CanonicalEntity<B extends object, M extends object> extends EntityEnvelope {
  body: B
  meta: M
}

export type EntityData<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
  type: string
  body: B
}

export type EntityPatch<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
  id: UUID
  version_id: UUID
  body: B
}

export type FormattedEntity<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
  type: string
  body: B
  meta: M
  schema: string
}

export interface ChangeEvent<B extends object, M extends object> {
  id: UUID
  action: ActionType
  entity: CanonicalEntity<B, M>
  schema: CanonicalSchema|undefined
}

export type AccessType = 'read'|'write'|'search'

export type AccessControlDecision = {
  granted: boolean
  explanation: string
}

export type Observer<B extends object, M extends object> = (event: CanonicalEntity<B, M>) => void|Promise<void>

export interface ValidationResponse {
  isValid: boolean
  message: string
}

export interface SearchableField {
  chain(field: SchemaField): void
  merge(field: SchemaField): void
  resolve(path: Array<string>, query: SearchQuery, schemaRoot: SearchableField): false|SearchQuery
}

export type SearchOperator = "noop"|"and"|"or"|"eq"|"in"|"neq"|"gt"|"lt"|"gte"|"lte"|"not"|"like"|"subquery"|"fulltext"
export interface SearchQuery {
  operator: SearchOperator
  args: Array<any>
}

export interface QueryCompiler<T> {
  compile(query: T): SearchQuery
}

export interface GetOptions {
  hydrate?: boolean
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sort?: string|Array<string>
  hydrate?: boolean
}

export interface SchemaEngine {
  register(type: string, schema: CanonicalSchema): void
  validate<T>(type: string, body: T): ValidationResponse
  format<T>(type: string, body: T): T
}

export interface SchemaRegistry {
  set(key: string, schema: CanonicalSchema): void
  get(key: string): CanonicalSchema|undefined
  observe(observer: (key: string, schema: CanonicalSchema) => void): void
}

export interface AccessControlAdapter<M extends object> {
  check<B extends object>(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision>
  getQuery(subject: UUID, access: AccessType): Promise<SearchQuery|undefined>
}

export interface ChangelogAdapter<M extends object> extends Service {
  observe(handler: <B extends object>(event: ChangeEvent<B, M>) => void|Promise<void>): void
  write<B extends object>(message: ChangeEvent<B, M>): Promise<void>
  readAll(): Promise<void>
}

export interface SearchIndex<M extends object> extends Service {
  update<B extends object>(action: ActionType, document: CanonicalEntity<B, M>, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>
  find<B extends object>(query: SearchQuery|{}, options: SearchOptions): Promise<Array<CanonicalEntity<B, M>>>
  count(query: SearchQuery|{}): Promise<number>
  isClean(): Promise<boolean>
}

export interface EntityRegistry<M extends object> extends Service {
  put<B extends object>(document: CanonicalEntity<B, M>): Promise<void>
  has(id: UUID): Promise<boolean>
  get<B extends object>(id: UUID): Promise<CanonicalEntity<B, M>>
  delete(id: UUID): Promise<void>
  isClean(): Promise<boolean>
}

export interface IdGenerator<T extends object> {
  id(body: T): UUID
}

export interface StorageConfig<M extends object> {
  // Adapters - override when changing underlying technology
  changelog?: ChangelogAdapter<M>
  index?: SearchIndex<M>
  state?: EntityRegistry<M>
  schemaEngine?: SchemaEngine
  schemaIdGenerator?: IdGenerator<CanonicalSchema>

  // Extensions - override when adding new rules/capacities
  schemaRegistry?: SchemaRegistry
  accessControl?: AccessControlAdapter<M>
  logger?: Logger

  // Built-in schemas for entity body and metadata
  meta?: Array<SchemaField>
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
  get<BodyType extends object>(id: UUID, options?: GetOptions, user?: UUID): Promise<CanonicalEntity<BodyType, MetaType> | undefined>
  find<BodyType extends object>(query?: SearchQuery|Dictionary<any>, options?: SearchOptions, user?: UUID): Promise<Array<CanonicalEntity<BodyType, MetaType>>>
  count(query?: SearchQuery|Dictionary<any>, user?: UUID): Promise<number>
  create<BodyType extends object>(data: EntityData<BodyType, MetaType>, user?: UUID): Promise<EntityEnvelope>
  update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, user?: UUID): Promise<EntityEnvelope>
  delete(id: UUID, user?: UUID): Promise<EntityEnvelope | undefined>
  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>): void
}
