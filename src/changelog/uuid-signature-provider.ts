import * as uuidv5 from 'uuid/v5'
import { SignatureProvider, IdGenerator, Entity, SignedEntity } from '../types'

export class UuidSignatureProvider implements SignatureProvider {
  private generateId: IdGenerator

  constructor(generator: IdGenerator) {
    this.generateId = generator
  }

  signNew(entity: Entity): SignedEntity {
    const id = this.generateId(entity.body)
    const version_id = uuidv5(JSON.stringify(entity.body), id)

    const Entity = {
      ...entity,
      id,
      version_id
    }

    return Entity
  }

  signVersion(entity: SignedEntity): SignedEntity {
    const version_id = uuidv5(JSON.stringify(entity.body), entity.id)

    const Entity = {
      ...entity,
      version_id
    }

    return Entity
  }
}
