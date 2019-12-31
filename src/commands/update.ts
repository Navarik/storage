export const updateCommand = (changeLog, state, schemaRegistry) => {
  const update = async (id, body, options) => {
    const previous = await state.get(id)

    if (!previous) {
      throw new Error(`[Storage.Commands] Can't update ${id}: it doesn't exist.`)
    }

    var type = previous.type || options.type
    if (!type) {
      throw new Error(`[Storage.Commands] Type is required from previous.type or options.type for id ${id}.`)
    }

    const next = schemaRegistry.format(type, body)
    const transaction = changeLog.registerUpdate(type, previous, next)

    return transaction
  }

  return update
}
