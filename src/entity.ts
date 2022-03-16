import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { UUID, ActionType, Timestamp, CanonicalEntity, EntityEnvelope } from './types'
import { ConflictError } from './errors/conflict-error'
import { Schema } from './schema'

export class Entity<B extends object, M extends object> implements CanonicalEntity<B, M> {
  public id: UUID
  public version_id: UUID
  public previous_version_id: UUID|null
  public last_action: ActionType
  public created_by: UUID
  public created_at: Timestamp
  public modified_by: UUID
  public modified_at: Timestamp
  public type: string
  public schema: UUID
  public body: B
  public meta: M

  constructor(data: Partial<CanonicalEntity<B, M>> = {}) {
    Object.assign(this, data)
  }

  create({ id = uuidv4(), body, meta }: { id?: UUID, body: B, meta: M }, { schema, metaSchema }: { schema: Schema, metaSchema: Schema }, user: UUID): Entity<B, M> {
    const now = new Date().toISOString()

    this.body = schema.format(body)
    this.type = schema.type
    this.schema = schema.id
    this.meta = metaSchema.format(meta || {})

    this.id = id
    this.version_id = uuidv5(JSON.stringify(this.body), this.id)
    this.previous_version_id = null
    this.last_action = "create"
    this.created_by = user
    this.created_at = now
    this.modified_by = user
    this.modified_at = now

    return this
  }

  update({ version_id, body, meta }: { version_id: UUID, type?: string, body?: B, meta?: M }, { schema, metaSchema }: { schema: Schema, metaSchema: Schema }, user: UUID): Entity<B, M> {
    if (this.version_id != version_id) {
      throw new ConflictError(`Update unsuccessful due to ${version_id} being not the latest version for entity ${this.id}`)
    }

    if (body) {
      Object.assign(this.body, body)
    }

    if (meta) {
      Object.assign(this.meta, meta)
    }

    const now = new Date().toISOString()

    this.body = schema.format(this.body)
    this.type = schema.type
    this.schema = schema.id
    this.meta = metaSchema.format(this.meta)

    this.version_id = uuidv5(JSON.stringify(this.body), this.id)
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
