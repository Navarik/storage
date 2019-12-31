import { Dictionary, Document } from '@navarik/types'

export type EntityType = string
export type EntityId = string
export type EntityBody = Dictionary<string|number|object>
export type CanonicalEntity = Document

export type IdGenerator = (body: EntityBody) => EntityId

export interface SignatureProvider {
  signNew(type: EntityType, body: EntityBody): CanonicalEntity
  signVersion(type: EntityType, newBody: EntityBody, oldBody: EntityBody): CanonicalEntity
}

export type Observer = (changeEvent: CanonicalEntity) => any

export interface ChangelogAdapter {
  observe(handler: Observer): void
  init(types: Array<EntityType>): Promise<void>
  write(message: CanonicalEntity): Promise<void>
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

export interface CommandProcessor {
  run(payload: Dictionary<any>): Promise<any>
}

export interface SchemaRegistry {
  exists(type: EntityType): Promise<boolean>
  format(type: EntityType, body: EntityBody): Promise<EntityBody>
}
