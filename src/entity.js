import uuidv4 from 'uuid/v4'
import { head } from './utils'
import EventEmitterQueueAdapter from './adapters/event-emitter-queue'
import SearchIndex from './ports/search-index'
import schemaRegistry from './ports/schema-registry'
import ChangeLog from './ports/change-log'

// Models
const searchIndex = new SearchIndex({
  format: data => schemaRegistry.format(data)
})

const changeLog = new ChangeLog({
  // Random unique identifier
  idGenerator: () => uuidv4(),
  topic: 'entity',
  queue: new EventEmitterQueueAdapter()
})

export const configure = () => {}

// Queries
export const findLatest = params => searchIndex.findLatest(params)
export const findVersions = params => searchIndex.findVersions(params)

export const getLatest = params => searchIndex.getLatest(params.id)
export const getVersion = params => searchIndex.getVersion(params.id, params.version)

// Commands
export const create = async (body) => {
  const entity = schemaRegistry.format(body)

  entity.data = await changeLog.logNew(entity.data)
  await searchIndex.add(entity.data)

  return entity
}

export const update = async (id, body) => {
  const entity = schemaRegistry.format(body)

  entity.data = await changeLog.logChange({ ...entity.data, id })
  await searchIndex.add(entity.data)

  return entity
}
