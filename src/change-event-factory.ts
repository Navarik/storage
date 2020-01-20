import { CanonicalEntity, ChangeEvent, ActionType } from './types'

export class ChangeEventFactory {
  createEvent(action: ActionType, entity: CanonicalEntity, parent?: CanonicalEntity): ChangeEvent {
    const changeEvent = {
      action,
      entity,
      parent,
      timestamp: entity.modified_at
    }

    return changeEvent
  }
}
