import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { EntityData, UUID, ChangeEvent } from '../types'
import { Schema } from "../schema"

interface Config {
  schema: Schema<any>
}

export class CreateAction<M extends object> {
  private schema: Schema<any>

  constructor({ schema }: Config) {
    this.schema = schema
  }

  request<B extends object>({ id, type, body, meta }: EntityData<B, M>, commitMessage: string, user: UUID): ChangeEvent<B, M> {
    const formatted = this.schema.format(type, body, meta || {})

    const newId = id || uuidv4()
    const now = new Date().toISOString()

    const changeEvent: ChangeEvent<B, M> = {
      id: uuidv4(),
      action: "create",
      user: user,
      message: commitMessage,
      entity: {
        id: newId,
        version_id: uuidv5(JSON.stringify(formatted.body), newId),
        previous_version_id: null,
        last_action: "create",
        created_by: user,
        created_at: now,
        modified_by: user,
        modified_at: now,
        type: formatted.schema.name,
        body: <B>formatted.body,
        meta: <M>formatted.meta || <M>{},
        schema: formatted.schemaId
      },
      schema: formatted.schema,
      parent: undefined,
      timestamp: now
    }

    return changeEvent
  }
}
