const initCommand = (schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer) => {
  const init = async () => {
    await schemaRegistry.reset()
    await schemaState.reset()
    await entityState.reset()

    schemaChangeLog.onChange(async (schema) => {
      schemaRegistry.register(schema.body)
      await schemaState.set(schema)

      return schema
    })

    entityChangeLog.onChange(async (entity) => {
      observer.emit(entity)
      await entityState.set(entity)

      return entity
    })

    if (!schemaState.isClean()) {
      await schemaChangeLog.reconstruct(['schema'])
    }

    if (!entityState.isClean()) {
      const types = schemaRegistry.listUserTypes()
      await entityChangeLog.reconstruct(types)
    }
  }

  return init
}

export default initCommand
