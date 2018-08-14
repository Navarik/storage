const updateCommand = (changeLog, state, schemaRegistry) => {
  const update = async (id, body) => {
    if (!state.exists(id)) {
      throw new Error(`[Storage] Can't update ${id}: it doesn't exist.`)
    }

    const previous = state.get(id)
    const next = schemaRegistry.format(previous.type, body)
    const transaction = changeLog.registerUpdate(previous.type, previous, next)

    return transaction
  }

  return update
}

export default updateCommand
