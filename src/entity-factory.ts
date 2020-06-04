import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { Dictionary } from '@navarik/types'
import { CoreDdl } from '@navarik/core-ddl'
import { IdGenerator, CanonicalEntity, PartialEntity, UUID, Document } from './types'

type FactoryConfig = {
  generators: Dictionary<IdGenerator>
  ddl: CoreDdl
  metaDdl: CoreDdl
  metaType: string
}

const defaultIdGenerator = () => uuidv4()

export class EntityFactory<B extends Document, M extends Document> {
  private idGenerators: Dictionary<IdGenerator>
  private ddl: CoreDdl
  private metaDdl: CoreDdl
  private metaType: string

  constructor({ generators, ddl, metaDdl, metaType }: FactoryConfig) {
    this.idGenerators = generators
    this.ddl = ddl
    this.metaDdl = metaDdl
    this.metaType = metaType
  }

  private generateId(type: string, body: B) {
    const generator = this.idGenerators[type] || defaultIdGenerator

    return generator(body)
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

    const id = previous ? previous.id : this.generateId(type, <B>formatted.body)
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
