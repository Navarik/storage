import { v5 as uuidv5 } from 'uuid'
import { CoreDdl } from '@navarik/core-ddl'
import { IdGenerator, CanonicalEntity, PartialEntity, UUID, Document } from './types'

type FactoryConfig = {
  generator: IdGenerator
  ddl: CoreDdl
  metaDdl: CoreDdl
  metaType: string
}

export class EntityFactory<B extends Document, M extends Document> {
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

  create(user: UUID, current: PartialEntity<B, M>, previous?: CanonicalEntity<B, M>): CanonicalEntity<B, M> {
    const prevType = previous ? previous.type : ""
    const prevBody = previous ? previous.body : {}
    const prevMeta = previous ? previous.meta : {}

    const type = current.type || prevType
    const body = { ...prevBody, ...current.body }
    const meta = { ...prevMeta, ...(current.meta || {}) }

    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta)

    const id = previous ? previous.id : this.generateId(formatted.body)
    const version_id = uuidv5(JSON.stringify(formatted.body), id)

    const now = new Date()

    const canonical: CanonicalEntity<B, M> = {
      id: id,
      version_id: version_id,
      parent_id: previous ? previous.version_id : null,
      modified_by: user,
      modified_at: now.toISOString(),
      type: formatted.schema.type,
      body: <B>formatted.body,
      meta: <M>formattedMeta.body,
      schema: formatted.schemaId
    }

    return canonical
  }
}
