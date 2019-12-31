import { CommandProcessor, EntityBody, EntityId, SchemaRegistry } from "../types"
import { ChangeLog } from "../change-log/changelog"

type CreatePayload = {
  id: EntityId
  body: EntityBody|Array<EntityBody>
  type?: string
}

type ProcessorConfig = {
  changeLog: ChangeLog
  schema: SchemaRegistry
  state: any
}

export class UpdateCommand implements CommandProcessor {
  private changeLog: ChangeLog
  private state
  private schema: SchemaRegistry

  constructor({ changeLog, state, schema }: ProcessorConfig) {
    this.changeLog = changeLog
    this.state = state
    this.schema = schema
  }

  async run({ id, type, body }: CreatePayload) {
    const previous = await this.state.get(id)

    if (!previous) {
      throw new Error(`[Storage.UpdateCommand] Can't update ${id}: it doesn't exist.`)
    }

    const newType = type || previous.type
    const newContent = await this.schema.format(newType, <EntityBody>body)
    const entity = await this.changeLog.registerUpdate(newType, previous, newContent)

    return entity
  }
}
