import { CommandProcessor, EntityBody, CanonicalEntity, SchemaRegistry } from "../types"
import { ChangeLog } from "../change-log/changelog"

type CreatePayload = {
  type: string
  body: EntityBody|Array<EntityBody>
}

type ProcessorConfig = {
  changeLog: ChangeLog
  schema: SchemaRegistry
}

export class CreateCommand implements CommandProcessor {
  private changeLog: ChangeLog
  private schema: SchemaRegistry

  constructor({ changeLog, schema }: ProcessorConfig) {
    this.changeLog = changeLog
    this.schema = schema
  }

  async run({ type, body }: CreatePayload): Promise<CanonicalEntity|Array<CanonicalEntity>> {
    if (body instanceof Array) {
      const documents = await Promise.all(body.map(x => this.run({ type, body: x })))
      return documents as Array<CanonicalEntity>
    }

    const content = await this.schema.format(type, body)
    const entity = await this.changeLog.registerNew(type, content)

    return entity
  }
}
