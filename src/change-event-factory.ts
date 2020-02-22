import { CanonicalEntity, ChangeEvent, ActionType, CanonicalSchema } from './types'

export class ChangeEventFactory {
  createEvent(action: ActionType, entity: CanonicalEntity, schema?: CanonicalSchema, parent?: CanonicalEntity): ChangeEvent {
    const changeEvent = {
      action,
      entity,
      schema,
      parent,
      timestamp: entity.modified_at
    }

    return changeEvent
  }
}
