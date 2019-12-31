import { Dictionary, Document } from '@navarik/types'

export type EntityType = string
export type EntityId = string
export type EntityBody = Dictionary<string|number|object>

export type SchemaField = string|Dictionary<any>|Array<any>
export type CanonicalSchema = {
  type: string
  description: string
  fields: Dictionary<SchemaField>
}

export type CanonicalEntity = Document

export type IdGenerator = (body: EntityBody) => EntityId

export interface SignatureProvider {
  signNew(type: EntityType, body: EntityBody): CanonicalEntity
  signVersion(type: EntityType, newBody: EntityBody, oldBody: EntityBody): CanonicalEntity
}

export type Observer<T> = (event: T) => any

export interface PubSub<T> {
  publish(event: T): Promise<void>
  subscribe(observer: Observer<T>): void
}

export interface ChangelogAdapter {
  observe(handler: Observer<CanonicalEntity>): void
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

export interface SchemaRegistryAdapter {
  get(type: EntityType): CanonicalSchema|undefined
  list(): Array<EntityType>
}

export type ValidationResponse = {
  isValid: boolean
  message: string
}

export interface SchemaEngine {
  validate(type: EntityType, body: EntityBody): ValidationResponse
  format(type: EntityType, body: EntityBody): EntityBody
}
