import { CoreDdl } from '@navarik/core-ddl'
import { CanonicalEntity, ChangeEvent, ActionType } from './types'

type FactoryConfig = {
  ddl: CoreDdl
}

export class ChangeEventFactory<B extends object, M extends object> {
  private ddl: CoreDdl

  constructor({ ddl }: FactoryConfig) {
    this.ddl = ddl
  }

  create(action: ActionType, entity: CanonicalEntity<B, M>, commitMessage: string): ChangeEvent<B, M> {
    return {
      action,
      user: entity.modified_by,
      message: commitMessage,
      entity: entity,
      schema: this.ddl.describe(entity.schema),
      parent: undefined,
      timestamp: entity.modified_at
    }
  }
}
