import { CommandProcessor } from "../types"
import { ChangeLog } from "../change-log/changelog"

export class InitCommand implements CommandProcessor {
  private schemaChangeLog: ChangeLog
  private entityChangeLog: ChangeLog
  private schemaState
  private entityState
  private schemaRegistry
  private observer

  constructor({ schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer }) {
    this.schemaChangeLog = schemaChangeLog
    this.entityChangeLog = entityChangeLog
    this.schemaState = schemaState
    this.entityState = entityState
    this.schemaRegistry = schemaRegistry
    this.observer = observer
  }

  async run() {
    await this.schemaRegistry.reset()
    await this.schemaState.reset()
    await this.entityState.reset()

    this.schemaChangeLog.onChange(async (schema) => {
      this.schemaRegistry.register(schema.body)
      await this.schemaState.set(schema)

      return schema
    })

    this.entityChangeLog.onChange(async (entity) => {
      this.observer.emit(entity)
      await this.entityState.set(entity)

      return entity
    })

    await this.schemaChangeLog.reconstruct(['schema'])
    const types = this.schemaRegistry.listUserTypes()
    await this.entityChangeLog.reconstruct(types)
  }
}
