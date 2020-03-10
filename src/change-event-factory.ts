import uuidv5 from 'uuid/v5'
import { IdGenerator, IdentifiedEntity, CanonicalEntity, TypedEntity, ChangeEvent } from './types'
import { CoreDdl } from '@navarik/core-ddl'

type FactoryConfig = {
  generator: IdGenerator
  ddl: CoreDdl
  metaDdl: CoreDdl
}

export class ChangeEventFactory {
  private generateId: IdGenerator
  private ddl: CoreDdl
  private metaDdl: CoreDdl

  constructor({ generator, ddl, metaDdl }: FactoryConfig) {
    this.generateId = generator
    this.ddl = ddl
    this.metaDdl = metaDdl
  }

  create(entity: TypedEntity): ChangeEvent {
    const formatted = this.ddl.format(entity.type, entity.body)

    const id = this.generateId(formatted.body)
    const version_id = uuidv5(JSON.stringify(formatted.body), id)

    const now = new Date()

    const canonical = {
      id: id,
      version_id: version_id,
      parent_id: null,
      created_at: now.toISOString(),
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: formatted.body,
      schema: formatted.schemaId
    }

    return {
      action: 'create',
      entity: canonical,
      schema: formatted.schema,
      parent: undefined,
      timestamp: canonical.modified_at
    }
  }

  createVersion(current: IdentifiedEntity, previous: CanonicalEntity): ChangeEvent {
    const type = current.type || previous.type
    const body = { ...previous.body, ...current.body }
    const formatted = this.ddl.format(type, body)

    const version_id = uuidv5(JSON.stringify(formatted.body), previous.id)

    const now = new Date()

    const canonical = {
      id: previous.id,
      version_id: version_id,
      parent_id: previous.version_id,
      created_at: previous.created_at,
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: formatted.body,
      schema: formatted.schemaId
    }

    return {
      action: 'update',
      entity: canonical,
      schema: formatted.schema,
      parent: previous,
      timestamp: canonical.modified_at
    }
  }

  delete(entity: CanonicalEntity): ChangeEvent {
    const now = new Date()

    return {
      action: 'delete',
      entity: entity,
      schema: this.ddl.describe(entity.schema),
      parent: undefined,
      timestamp: now.toISOString()
    }
  }
}
