import uuidv4 from 'uuid/v4'
import { head } from './utils'
import Metadata from './metadata'
import * as searchIndex from './ports/search-index'
import * as schemaRegistry from './ports/schema-registry'
import * as changeLog from './ports/change-log'

// Model
const entityMetadata = new Metadata({
  // Random unique identifier
  idGenerator: () => uuidv4()
})

const withSchema = query => async (params) => {
  const data = await query(params)
  const entities = await schemaRegistry.format(data)

  return entities
}

// Queries
export const findLatest = withSchema(searchIndex.findLatest)
export const findVersions = withSchema(searchIndex.findVersions)
export const getLatest = withSchema(params => searchIndex.getLatest(params.id))
export const getVersion = withSchema(params => searchIndex.getVersion(params.id, params.version))

// Commands
export const create = async (body) => {
  const entity = schemaRegistry.format({ ...body, version: 1 })

  entity.data = entityMetadata.signNewDocument(entity.data)
  await changeLog.record(entity.data)
  await searchIndex.add(entity.data)

  return entity
}

export const update = async (id, body) => {
  const previous = changeLog.latestVersion(id)
  const entity = schemaRegistry.format({
    ...previous,
    ...body,
    version: previous.version + 1
  })

  entity.data = entityMetadata.signNewVersion(entity.data)
  await changeLog.record(entity.data)
  await searchIndex.add(entity.data)

  return entity
}
