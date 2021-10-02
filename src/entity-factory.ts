import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { CanonicalEntity, EntityData, EntityPatch, UUID, SchemaRegistry } from './types'
import { ValidationError } from "./errors/validation-error"
import { ConflictError } from './errors/conflict-error'

interface FactoryConfig {
  ddl: SchemaRegistry
  metaDdl: SchemaRegistry
  metaType: string
}

export class EntityFactory<M extends object> {
  private ddl: SchemaRegistry
  private metaDdl: SchemaRegistry
  private metaType: string

  constructor({  ddl, metaDdl, metaType }: FactoryConfig) {
    this.ddl = ddl
    this.metaDdl = metaDdl
    this.metaType = metaType
  }

  create<B extends object>({ id, type, body, meta }: EntityData<B, M>, user: UUID): CanonicalEntity<B, M> {
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
      meta: <M>formattedMeta.body || <M>{},
      schema: formatted.schemaId
    }

    return canonical
  }

  merge<B extends object>(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, patch: EntityPatch<B, M>, user: UUID): CanonicalEntity<B, M> {
    // check if update is not based on an outdated entity
    if (!patch.version_id) {
      throw new ConflictError(`[Storage] Update unsuccessful due to missing version_id`)
    }
    if (oldEntity.version_id != patch.version_id) {
      throw new ConflictError(`[Storage] ${patch.version_id} is not the latest version id for entity ${patch.id}`)
    }

    const type = patch.type || oldEntity.type
    const body = patch.body ? patch.body : {}
    const formatted = this.ddl.format(type, <B>{ ...oldEntity.body, ...body })
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
      meta: <M>formattedMeta.body || <M>{},
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
