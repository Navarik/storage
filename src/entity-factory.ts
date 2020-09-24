import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { Dictionary } from '@navarik/types'
import { CoreDdl } from '@navarik/core-ddl'
import { IdGenerator, CanonicalEntity, EntityData, PartialEntity, UUID } from './types'
import { ValidationError } from "./validation-error"

type FactoryConfig = {
  generators: Dictionary<IdGenerator>
  ddl: CoreDdl
  metaDdl: CoreDdl
  metaType: string
}

const defaultIdGenerator = () => uuidv4()

export class EntityFactory<B extends object, M extends object> {
  private idGenerators: Dictionary<IdGenerator>
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private metaType: string

  constructor({ generators, ddl, metaDdl, metaType }: FactoryConfig) {
    this.idGenerators = generators
    this.ddl = ddl
    this.metaDdl = metaDdl
    this.metaType = metaType
  }

  private generateId(type: string, body: B) {
    const generator = this.idGenerators[type] || defaultIdGenerator

    return generator(body)
  }

  private checkVersions(id: string, prevVersionId: string, versionId: string|undefined) {
    if (!versionId){
      throw new ValidationError(`[Storage] Update unsuccessful due to missing version_id`)
    }
    if (prevVersionId != versionId) {
      throw new ValidationError(`[Storage] ${versionId} is not the latest version id for entity ${id}`)
    }
  }

  getEmpty(): CanonicalEntity<Partial<B>, Partial<M>> {
    return {
      id: "",
      version_id: "",
      parent_id: null,
      created_by: "",
      created_at: "",
      modified_by: "",
      modified_at: "",
      type: "",
      body: {},
      meta: {},
      schema: ""
    }
  }

  merge(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, newEntity: PartialEntity<B, M>): EntityData<B, M> {

    // check if update is not based on an outdated entity
    const { id, version_id } = oldEntity
    const { versionId } = newEntity
    
    if (oldEntity.id){
      this.checkVersions(id, version_id, versionId)
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
    const { id, type, body, meta } = data

    const { isValid, message } = this.ddl.validate(data.type, data.body)
    if (!isValid) {
      throw new ValidationError(`[Storage] Validation failed for ${data.type}. ${message}`)
    }

    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta)

    const newId = id || this.generateId(type, <B>formatted.body)
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
