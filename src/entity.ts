import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { UUID, ActionType, Timestamp, CanonicalEntity, EntityEnvelope } from './types'
import { ConflictError } from './errors/conflict-error'
import { Schema } from './schema'

export class Entity<B extends object, M extends object> implements CanonicalEntity<B, M> {
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
  body: B
  meta: M

  constructor(data: Partial<CanonicalEntity<B, M>> = {}) {
    this.id = data.id
    this.version_id = data.version_id
    this.previous_version_id = data.previous_version_id
    this.last_action = data.last_action
    this.created_by = data.created_by
    this.created_at = data.created_at
    this.modified_by = data.modified_by
    this.modified_at = data.modified_at
    this.type = data.type
    this.schema = data.schema
    this.body = data.body
    this.meta = data.meta
  }

  create({ id = uuidv4(), body, meta }: { id?: UUID, body: B, meta: M }, user: UUID): Entity<B, M> {
    const now = new Date().toISOString()

    this.id = id
    this.previous_version_id = null
    this.last_action = "create"
    this.created_by = user
    this.created_at = now
    this.modified_by = user
    this.modified_at = now
    this.body = body
    this.meta = meta

    return this
  }

  update({ version_id, type, body, meta }: { version_id: UUID, type?: string, body?: B, meta?: M }, user: UUID): Entity<B, M> {
    if (this.version_id != version_id) {
      throw new ConflictError(`Update unsuccessful due to ${version_id} being not the latest version for entity ${this.id}`)
    }

    if (type) {
      this.type = type
    }

    if (body) {
      Object.assign(this.body, body)
    }

    if (meta) {
      Object.assign(this.meta, meta)
    }

    const now = new Date().toISOString()

    this.previous_version_id = this.version_id
    this.last_action = "update"
    this.modified_by = user
    this.modified_at = now

    return this
  }

  delete(user: UUID): Entity<B, M> {
    const now = new Date().toISOString()

    this.last_action = "delete"
    this.modified_by = user
    this.modified_at = now

    return this
  }

  formatBody(schema: Schema): Entity<B, M> {
    this.body = schema.format(this.body)
    this.type = schema.type
    this.schema = schema.id

    return this
  }

  sign(): Entity<B, M> {
    this.version_id = uuidv5(JSON.stringify(this.body), this.id)

    return this
  }

  formatMeta(schema: Schema): Entity<B, M> {
    this.meta = schema.format(this.meta || {})

    return this
  }

  canonical(): CanonicalEntity<B, M> {
    return {
      id: this.id,
      version_id: this.version_id,
      previous_version_id: this.previous_version_id,
      last_action: this.last_action,
      created_by: this.created_by,
      created_at: this.created_at,
      modified_by: this.modified_by,
      modified_at: this.modified_at,
      type: this.type,
      schema: this.schema,
      body: this.body,
      meta: this.meta
    }
  }

  envelope(): EntityEnvelope {
    return {
      id: this.id,
      version_id: this.version_id,
      previous_version_id: this.previous_version_id,
      last_action: this.last_action,
      created_by: this.created_by,
      created_at: this.created_at,
      modified_by: this.modified_by,
      modified_at: this.modified_at,
      type: this.type,
      schema: this.schema
    }
  }
}
