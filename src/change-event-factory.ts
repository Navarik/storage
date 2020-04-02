import { v5 as uuidv5 } from 'uuid'
import { CoreDdl } from '@navarik/core-ddl'
import { IdGenerator, IdentifiedEntity, CanonicalEntity, TypedEntity, ChangeEvent, UUID } from './types'

type FactoryConfig = {
  generator: IdGenerator
  ddl: CoreDdl
  metaDdl: CoreDdl
  metaType: string
}

export class ChangeEventFactory {
  private generateId: IdGenerator
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private metaType: string

  constructor({ generator, ddl, metaDdl, metaType }: FactoryConfig) {
    this.generateId = generator
    this.ddl = ddl
    this.metaDdl = metaDdl
    this.metaType = metaType
  }

  create(user: UUID, entity: TypedEntity): ChangeEvent {
    const formatted = this.ddl.format(entity.type, entity.body)
    const formattedMeta = this.metaDdl.format(this.metaType, entity.meta || {})

    const id = this.generateId(formatted.body)
    const version_id = uuidv5(JSON.stringify(formatted.body), id)

    const now = new Date()

    const canonical = {
      id: id,
      version_id: version_id,
      parent_id: null,
      created_by: user,
      created_at: now.toISOString(),
      modified_by: user,
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: formatted.body,
      meta: formattedMeta.body,
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

  createVersion(user: UUID, current: IdentifiedEntity, previous: CanonicalEntity): ChangeEvent {
    const type = current.type || previous.type
    const body = { ...previous.body, ...current.body }
    const meta = { ...previous.meta, ...(current.meta || {}) }
    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta)

    const version_id = uuidv5(JSON.stringify(formatted.body), previous.id)

    const now = new Date()

    const canonical = {
      id: previous.id,
      version_id: version_id,
      parent_id: previous.version_id,
      created_by: previous.created_by,
      created_at: previous.created_at,
      modified_by: user,
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: formatted.body,
      meta: formattedMeta.body,
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
