import { v5 as uuidv5, v4 as uuidv4 } from 'uuid'
import { Dictionary } from '@navarik/types'
import { CoreDdl } from '@navarik/core-ddl'
import { IdGenerator, CanonicalEntity, EntityData, UUID, Document } from './types'
import { ValidationError } from "./validation-error"

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

  create(data: EntityData<B, M>, user: UUID, parentVersionId: UUID|null): CanonicalEntity<B, M> {
    const { id, type, body, meta } = data

    const { isValid, message } = this.ddl.validate(data.type, data.body)
    if (!isValid) {
      throw new ValidationError(`[Storage] Validation failed for ${data.type}. ${message}`)
    }

    const formatted = this.ddl.format(type, body)
    const formattedMeta = this.metaDdl.format(this.metaType, meta)

    const newId = id || this.generateId(type, <B>formatted.body)
    const version_id = uuidv5(JSON.stringify(formatted.body), newId)

    const now = new Date()

    const canonical: CanonicalEntity<B, M> = {
      id: newId,
      version_id: version_id,
      parent_id: parentVersionId,
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
