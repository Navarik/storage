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

  private checkVersions(id: string, prevVersionId: string, version_id: string|undefined) {
    if (!version_id){
      throw new ConflictError(`[Storage] Update unsuccessful due to missing version_id`)
    }
    if (prevVersionId != version_id) {
      throw new ConflictError(`[Storage] ${version_id} is not the latest version id for entity ${id}`)
    }
  }

  merge(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, newEntity: EntityPatch<B, M>): EntityData<B, M> {
    // check if update is not based on an outdated entity
    const { id, version_id } = oldEntity

    if (oldEntity.id){
      this.checkVersions(id, version_id, newEntity.version_id)
    }

    return {
      id: newEntity.id || oldEntity.id,
      created_by: oldEntity.created_by,
      created_at: oldEntity.created_at,
      type: newEntity.type || oldEntity.type,
      body: <B>{ ...oldEntity.body, ...(newEntity.body || {}) },
      meta: <M>{ ...oldEntity.meta, ...(newEntity.meta || {}) }
    }
  }

  create(data: EntityData<B, M>, user: UUID, parentVersionId?: UUID): CanonicalEntity<B, M> {
    const { id, type, body, meta = {} } = data

    const { isValid, message } = this.ddl.validate(data.type, data.body)
    if (!isValid) {
      throw new ValidationError(`[Storage] Validation failed for ${data.type}. ${message}`)
    }

    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta)

    const newId = id || uuidv4()
    const version_id = uuidv5(JSON.stringify(formatted.body), newId)

    const now = new Date()

    const canonical: CanonicalEntity<B, M> = {
      id: newId,
      version_id: version_id,
      parent_id: parentVersionId || null,
      created_by: data.created_by || user,
      created_at: data.created_at || now.toISOString(),
      modified_by: user,
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: <B>formatted.body,
      meta: <M>formattedMeta.body || {},
      schema: formatted.schemaId
    }

    return canonical
  }
}
