import { CanonicalEntity, ChangeEvent } from './types'

type ActionType = 'create'|'update'|'delete'|'cast'

export class ChangeEventFactory {
  createEvent(action: ActionType, entity: CanonicalEntity): ChangeEvent {
    const changeEvent = {
      action,
      entity,
      parent: entity.parent_id,
      timestamp: entity.modified_at
    }

    return changeEvent
  }
}
