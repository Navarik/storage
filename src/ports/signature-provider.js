//@flow
import uuidv5 from 'uuid/v5'

import type { SignatureProviderInterface, DocumentBody, ChangeRecord, IdGenerator, Identifier } from '../flowtypes'

class SignatureProvider implements SignatureProviderInterface {
  generateId: IdGenerator

  constructor(generator: IdGenerator) {
    this.generateId = generator
  }

  signNew(body: DocumentBody) {
    const id = this.generateId(body)
    const version_id = uuidv5(JSON.stringify(body), id)
    const now = new Date()

    const document = {
      id,
      version_id,
      version: 1,
      created_at: now.toISOString(),
      modified_at: now.toISOString(),
      body
    }

    return document
  }

  signVersion(body: DocumentBody, previous: ChangeRecord) {
    const id = previous.id
    const version_id = uuidv5(JSON.stringify(body), id)
    const now = new Date()

    const document = {
      id,
      version_id,
      version: previous.version + 1,
      created_at: previous.created_at,
      modified_at: now.toISOString(),
      body
    }

    return document
  }
}

export default SignatureProvider
