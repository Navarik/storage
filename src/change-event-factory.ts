import { CanonicalEntity, ChangeEvent, ActionType, SchemaRegistry } from './types'

type FactoryConfig = {
  ddl: SchemaRegistry
}

export class ChangeEventFactory<B extends object, M extends object> {
  private ddl: SchemaRegistry

  constructor({ ddl }: FactoryConfig) {
    this.ddl = ddl
  }

  create(action: ActionType, entity: CanonicalEntity<B, M>, commitMessage: string): ChangeEvent<B, M> {
    let schema = this.ddl.describe(entity.schema)

    // If can't find this particular version of the schema, fallback to the latest version
    if (!schema) {
      schema = this.ddl.describe(entity.type)
    }

    if (!schema) {
      throw new Error(`[Storage] Cannot find schema for ${entity.type} (schema version: ${entity.schema})`)
    }

    return {
      action,
      user: entity.modified_by,
      message: commitMessage,
      entity: entity,
      schema: schema,
      parent: undefined,
      timestamp: entity.modified_at
    }
  }
}
