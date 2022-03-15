import { CanonicalEntity, UUID, FormattedEntity } from '../types'

export class DeleteAction<M extends object> {
  request<B extends object>(entity: FormattedEntity<B, M>, user: UUID): CanonicalEntity<B, M> {
    const now = new Date().toISOString()

    return {
      id: entity.id,
      version_id: entity.version_id,
      previous_version_id: entity.previous_version_id,
      last_action: "delete",
      created_by: entity.created_by,
      created_at: entity.created_at,
      modified_by: user,
      modified_at: now,
      type: entity.type,
      body: entity.body,
      meta: entity.meta,
      schema: entity.schema
    }
  }
}
