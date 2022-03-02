import { v4 as uuidv4 } from 'uuid'
import { CanonicalEntity, UUID, ChangeEvent } from '../types'
import { Schema } from "../schema"

interface Config {
  schema: Schema<any>
}

export class DeleteAction<M extends object> {
  private schema: Schema<any>

  constructor({ schema }: Config) {
    this.schema = schema
  }

  request<B extends object>(entity: CanonicalEntity<B, M>, commitMessage: string, user: UUID): ChangeEvent<B, M> {
    const now = new Date().toISOString()
    const schema = this.schema.describeEntity(entity)

    const changeEvent: ChangeEvent<B, M> = {
      id: uuidv4(),
      action: "delete",
      user: user,
      message: commitMessage,
      entity: {
        ...entity,
        last_action: "delete",
        modified_by: user,
        modified_at: now
      },
      schema: schema,
      parent: undefined,
      timestamp: now
    }

    return changeEvent
  }
}
