import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import deepCopy from "deepcopy"
import { UUID, ActionType, Timestamp, CanonicalEntity, EntityEnvelope } from './types'
import { ConflictError } from './errors/conflict-error'
import { SchemaType } from './schema-type'

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

  constructor(data: CanonicalEntity<B, M>) {
    this.id = data.id
    this.version_id = data.version_id
    this.previous_version_id = data.previous_version_id || null
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

  static create<B extends object, M extends object>({ id = uuidv4(), body, meta }: { id?: UUID, body: B, meta: M }, { schema, metaSchema }: { schema: SchemaType, metaSchema: SchemaType }, user: UUID): Entity<B, M> {
    const now = new Date().toISOString()

    const formattedBody = schema.format<B>(body)

    return new Entity<B, M>({
      body: formattedBody,
      type: schema.type,
      schema: schema.id,
      meta: metaSchema.format(meta || {}),
      id: id,
      previous_version_id: null,
      version_id: uuidv5(JSON.stringify(formattedBody), id),
      last_action: "create",
      created_by: user,
      created_at: now,
      modified_by: user,
      modified_at: now
    })
  }

  update({ version_id, body, meta }: { version_id: UUID, type?: string, body?: B, meta?: M }, { schema, metaSchema }: { schema: SchemaType, metaSchema: SchemaType }, user: UUID): Entity<B, M> {
    if (this.version_id != version_id) {
      throw new ConflictError(`Update unsuccessful due to ${version_id} being not the latest version for entity ${this.id}`)
    }

    if (body) {
      this.body = deepCopy({ ...this.body, ...body })
    }

    if (meta) {
      this.meta = deepCopy({ ...this.meta, ...meta })
    }

    const now = new Date().toISOString()

    this.body = schema.format(this.body)
    this.type = schema.type
    this.schema = schema.id
    this.meta = metaSchema.format(this.meta)

    this.previous_version_id = this.version_id
    this.version_id = uuidv5(JSON.stringify(this.body), this.id)
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
      previous_version_id: this.previous_version_id,
      version_id: this.version_id,
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
