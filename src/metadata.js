import uuidv5 from 'uuid/v5'

class Metadata {
  constructor(config) {
    this.idGenerator = config.idGenerator
  }

  signNewVersion(data) {
    return {
      ...data,
      modified_at: Date.now(),
      version_id: uuidv5(JSON.stringify(data), data.id)
    }
  }

  signNewDocument(data) {
    if (data.id) {
      throw new Error("Can't assign new ID to an existing document")
    }

    return this.signNewVersion({
      ...data,
      created_at: Date.now(),
      id: this.idGenerator(data)
    })
  }
}

export default Metadata
