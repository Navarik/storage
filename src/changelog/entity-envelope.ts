import { CanonicalEntity } from "../types"

export function entityEnvelope<B extends object, M extends object>(entity: CanonicalEntity<B, M>) {
  return {
    id: entity.id,
    version_id: entity.version_id,
    previous_version_id: entity.previous_version_id,
    last_action: entity.last_action,
    created_by: entity.created_by,
    created_at: entity.created_at,
    modified_by: entity.modified_by,
    modified_at: entity.modified_at,
    type: entity.type,
    schema: entity.schema
  }
}
