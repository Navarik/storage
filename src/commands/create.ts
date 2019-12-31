export const createCommand = (changeLog, schemaRegistry) => {
  const create = async (type, body) => {
    if (body instanceof Array) {
      return Promise.all(body.map(x => create(type, x)))
    }

    if (type === 'schema' && schemaRegistry.exists(body.name)) {
      throw new Error(`[Storage.Commands] Attempting to create schema that already exists: ${body.name}.`)
    }

    const document = schemaRegistry.format(type, body)
    const transaction = changeLog.registerNew(type, document)

    return transaction
  }

  return create
}
