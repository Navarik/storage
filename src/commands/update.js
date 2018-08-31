const updateCommand = (changeLog, state, schemaRegistry) => {
  const update = async (id, body, options) => {
    if (!state.exists(id)) {
      throw new Error(`[Storage.Commands] Can't update ${id}: it doesn't exist.`)
    }

    const previous = state.get(id)
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

export default updateCommand
