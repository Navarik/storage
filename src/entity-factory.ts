import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { CanonicalEntity, EntityData, EntityPatch, UUID } from './types'
import { ConflictError } from './errors/conflict-error'
import { Schema } from "./schema"

interface FactoryConfig {
  schema: Schema<any>
}

export class EntityFactory<M extends object> {
  private schema: Schema<any>

  constructor({ schema }: FactoryConfig) {
    this.schema = schema
  }

  create<B extends object>({ id, type, body, meta }: EntityData<B, M>, user: UUID): CanonicalEntity<B, M> {
    const formatted = this.schema.format(type, body, meta || {})

    const newId = id || uuidv4()
    const now = new Date()

    const canonical: CanonicalEntity<B, M> = {
      id: newId,
      version_id: uuidv5(JSON.stringify(formatted.body), newId),
      previous_version_id: null,
      created_by: user,
      created_at: now.toISOString(),
      modified_by: user,
      modified_at: now.toISOString(),
      type: formatted.schema.name,
      body: <B>formatted.body,
      meta: <M>formatted.meta || <M>{},
      schema: formatted.schemaId
    }

    return canonical
  }

  merge<B extends object>(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, patch: EntityPatch<B, M>, user: UUID): CanonicalEntity<B, M> {
    // check if update is not based on an outdated entity
    if (!patch.version_id) {
      throw new ConflictError(`Update unsuccessful due to missing version_id`)
    }
    if (oldEntity.version_id != patch.version_id) {
      throw new ConflictError(`${patch.version_id} is not the latest version id for entity ${patch.id}`)
    }

    const type = patch.type || oldEntity.type
    const body = patch.body ? patch.body : {}
    const newBody = { ...oldEntity.body, ...body }
    const newMeta = { ...oldEntity.meta, ...(patch.meta || {}) }

    const formatted = this.schema.format(type, newBody, newMeta)
    const now = new Date()

    return {
      id: oldEntity.id,
      version_id: uuidv5(JSON.stringify(formatted.body), oldEntity.id),
      previous_version_id: oldEntity.version_id,
      created_by: oldEntity.created_by,
      created_at: oldEntity.created_at,
      modified_by: user,
      modified_at: now.toISOString(),
      type,
      body: <B>formatted.body,
      meta: <M>formatted.meta,
      schema: formatted.schemaId
    }
  }

  remove<B extends object>(entity: CanonicalEntity<B, M>, user: UUID): CanonicalEntity<B, M> {
    const now = new Date()

    return {
      ...entity,
      modified_by: user,
      modified_at: now.toISOString()
    }
  }
}
