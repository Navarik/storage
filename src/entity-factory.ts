import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { CoreDdl } from '@navarik/core-ddl'
import { CanonicalEntity, EntityData, EntityPatch, UUID } from './types'
import { ValidationError } from "./errors/validation-error"
import { ConflictError } from './errors/conflict-error'

type FactoryConfig = {
  ddl: CoreDdl
  metaDdl: CoreDdl
  metaType: string
}

export class EntityFactory<B extends object, M extends object> {
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private metaType: string

  constructor({  ddl, metaDdl, metaType }: FactoryConfig) {
    this.ddl = ddl
    this.metaDdl = metaDdl
    this.metaType = metaType
  }

  create({ id, type, body, meta }: EntityData<B, M>, user: UUID): CanonicalEntity<B, M> {
    const { isValid, message } = this.ddl.validate(type, body)
    if (!isValid) {
      throw new ValidationError(`[Storage] Validation failed for ${type}. ${message}`)
    }

    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta || {})

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
      type: formatted.schema.type,
      body: <B>formatted.body,
      meta: <M>formattedMeta.body || {},
      schema: formatted.schemaId
    }

    return canonical
  }

  merge(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, patch: EntityPatch<B, M>, user: UUID): CanonicalEntity<B, M> {
    // check if update is not based on an outdated entity
    if (!patch.version_id) {
      throw new ConflictError(`[Storage] Update unsuccessful due to missing version_id`)
    }
    if (oldEntity.version_id != patch.version_id) {
      throw new ConflictError(`[Storage] ${patch.version_id} is not the latest version id for entity ${patch.id}`)
    }

    const type = patch.type || oldEntity.type
    const formatted = this.ddl.format(type, <B>{ ...oldEntity.body, ...(patch.body || {}) })
    const formattedMeta = this.metaDdl.format(this.metaType, <M>{ ...oldEntity.meta, ...(patch.meta || {}) })
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
      meta: <M>formattedMeta.body || {},
      schema: formatted.schemaId
    }
  }
}
