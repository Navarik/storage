import uuidv4 from 'uuid/v4'
import { head } from './utils'
import Metadata from './metadata'
import SearchIndex from './ports/search-index'
import schemaRegistry from './ports/schema-registry'
import * as changeLog from './ports/change-log'

// Models
const searchIndex = new SearchIndex({
  format: data => schemaRegistry.format(data)
})

const metadata = new Metadata({
  // Random unique identifier
  idGenerator: () => uuidv4()
})

// Queries
export const findLatest = params => searchIndex.findLatest(params)
export const findVersions = params => searchIndex.findVersions(params)

export const getLatest = params => searchIndex.getLatest(params.id)
export const getVersion = params => searchIndex.getVersion(params.id, params.version)

// Commands
export const create = async (body) => {
  const entity = schemaRegistry.format({ ...body, version: 1 })

  entity.data = metadata.signNewDocument(entity.data)
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

  entity.data = metadata.signNewVersion(entity.data)
  await changeLog.record(entity.data)
  await searchIndex.add(entity.data)

  return entity
}
