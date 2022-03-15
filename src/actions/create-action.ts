import { v5 as uuidv5 } from 'uuid'
import { UUID, FormattedEntity, CanonicalEntity } from '../types'

export class CreateAction<M extends object> {
  request<B extends object>(entity: FormattedEntity<B, M>, user: UUID): CanonicalEntity<B, M> {
    const now = new Date().toISOString()

    return {
      id: entity.id,
      version_id: uuidv5(JSON.stringify(entity.body), entity.id),
      previous_version_id: null,
      last_action: "create",
      created_by: user,
      created_at: now,
      modified_by: user,
      modified_at: now,
      type: entity.type,
      body: entity.body,
      meta: entity.meta,
      schema: entity.schema
    }
  }
}
