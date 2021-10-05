import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { CanonicalEntity, EntityPatch, UUID, ChangeEvent } from '../types'
import { ConflictError } from '../errors/conflict-error'
import { Schema } from "../schema"

interface Config {
  schema: Schema<any>
}

export class UpdateAction<M extends object> {
  private schema: Schema<any>

  constructor({ schema }: Config) {
    this.schema = schema
  }

  request<B extends object>(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, patch: EntityPatch<B, M>, commitMessage: string, user: UUID): ChangeEvent<B, M> {
    // check if update is not based on an outdated entity
    if (!patch.version_id) {
      throw new ConflictError(`Update unsuccessful due to missing version_id.`)
    }
    if (oldEntity.version_id != patch.version_id) {
      throw new ConflictError(`${patch.version_id} is not the latest version id for entity "${patch.id}".`)
    }

    const type = patch.type || oldEntity.type
    const body = patch.body ? patch.body : {}
    const newBody = { ...oldEntity.body, ...body }
    const newMeta = { ...oldEntity.meta, ...(patch.meta || {}) }

    const formatted = this.schema.format(type, newBody, newMeta)
    const now = new Date().toISOString()

    const changeEvent: ChangeEvent<B, M> = {
      id: uuidv4(),
      action: "update",
      user: user,
      message: commitMessage,
      entity: {
        id: oldEntity.id,
        version_id: uuidv5(JSON.stringify(formatted.body), oldEntity.id),
        previous_version_id: oldEntity.version_id,
        created_by: oldEntity.created_by,
        created_at: oldEntity.created_at,
        modified_by: user,
        modified_at: now,
        type,
        body: <B>formatted.body,
        meta: <M>formatted.meta,
        schema: formatted.schemaId
      },
      schema: formatted.schema,
      parent: undefined,
      timestamp: now
    }

    return changeEvent
  }
}
