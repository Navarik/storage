import * as uuidv5 from 'uuid/v5'
import { SignatureProvider, IdGenerator, Entity, CanonicalEntity } from '../types'

export class UuidSignatureProvider implements SignatureProvider {
  private generateId: IdGenerator

  constructor(generator: IdGenerator) {
    this.generateId = generator
  }

  signNew(entity: Entity): CanonicalEntity {
    const id = this.generateId(entity.body)
    const version_id = uuidv5(JSON.stringify(entity.body), id)
    const now = new Date()

    const Entity = {
      ...entity,
      id,
      version_id,
      created_at: now.toISOString(),
      modified_at: now.toISOString()
    }

    return Entity
  }

  signVersion(entity: CanonicalEntity): CanonicalEntity {
    const version_id = uuidv5(JSON.stringify(entity.body), entity.id)
    const now = new Date()

    const Entity = {
      ...entity,
      version_id,
      modified_at: now.toISOString()
    }

    return Entity
  }
}
