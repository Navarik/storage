import { Dictionary } from '@navarik/types'
import { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, EntityBody } from '@navarik/core-ddl/src/types'

export type Timestamp = string
export type EntityType = string
export type UUID = string

export interface Entity extends Dictionary<any> {
  type: EntityType
  body: EntityBody
  schema: UUID|CanonicalSchema
}
export interface CanonicalEntity extends Entity {
  id: UUID
  version_id: UUID
  created_at: Timestamp
  modified_at: Timestamp
}

export type IdGenerator = (body: EntityBody) => UUID

export interface SignatureProvider {
  signNew(entity: Entity): SignedEntity
  signVersion(entity: SignedEntity): SignedEntity
}

export type Observer<T> = (event: T) => any

export interface PubSub<T> {
  publish(event: T): Promise<void>
  subscribe(observer: Observer<T>): void
}

export interface ChangelogAdapter<T> {
  observe(handler: Observer<T>): void
  init(types: Array<EntityType>): Promise<void>
  write(message: T): Promise<void>
  isConnected(): boolean
}

export interface Transaction<T> {
  promise: Promise<T>
  resolve: (message: T) => any
  reject: (message: T) => any
}

export interface TransactionManager {
  commit(key: string, message: any): void
  reject(key: string, message: any): void
  start(key: string): Transaction<any>
}

export interface Factory<T> {
  create(config?: Dictionary<any>): T
}

export { SchemaRegistryAdapter, CanonicalSchema, ValidationResponse, EntityBody }
