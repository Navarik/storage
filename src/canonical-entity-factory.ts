import uuidv5 from 'uuid/v5'
import { EntityFactory, IdGenerator, FormattedEntity, CanonicalEntity } from './types'

export class CanonicalEntityFactory implements EntityFactory {
  private generateId: IdGenerator

  constructor(generator: IdGenerator) {
    this.generateId = generator
  }

  create(entity: FormattedEntity): CanonicalEntity {
    const id = this.generateId(entity.body)
    const version_id = uuidv5(JSON.stringify(entity.body), id)
    const now = new Date()

    return {
      id,
      version_id,
      created_at: now.toISOString(),
      modified_at: now.toISOString(),
      type: entity.schema.type,
      body: entity.body,
      schema: entity.schemaId
   }
  }

  createVersion(current: FormattedEntity, previous: CanonicalEntity): CanonicalEntity {
    const version_id = uuidv5(JSON.stringify(current.body), previous.id)
    const now = new Date()

    return {
      id: previous.id,
      version_id,
      created_at: previous.created_at,
      modified_at: now.toISOString(),
      type: current.schema.type,
      body: current.body,
      schema: current.schemaId
   }
  }
}
