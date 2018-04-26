import uuidv4 from 'uuid/v4'
import SearchIndex from '../ports/search-index'
import ChangeLog from '../ports/change-log'
import schemaRegistry from './schema-registry'

const entityModel = (config) => {
  const searchIndex = new SearchIndex({
    formatOut: data => schemaRegistry.format(data)
  })

  const changeLog = new ChangeLog({
    // Random unique identifier
    idGenerator: () => uuidv4(),
    topic: 'entity',
    queue: config.queue
  })

  const restoreState = async () => {
    const { log, latest } = await changeLog.reconstruct()
    await searchIndex.init(latest, log)
  }

  // Commands
  const create = async (body) => {
    const entity = schemaRegistry.format(body)

    entity.data = await changeLog.logNew(entity.data)
    await searchIndex.add(entity.data)

    return entity
  }

  const update = async (id, body) => {
    const entity = schemaRegistry.format(body)

    entity.data = await changeLog.logChange({ ...entity.data, id })
    await searchIndex.add(entity.data)

    return entity
  }

  // API
  return {
    findLatest: params => searchIndex.findLatest(params),
    findVersions: params => searchIndex.findVersions(params),
    getLatest: params => searchIndex.getLatest(params.id),
    getVersion: params => searchIndex.getVersion(params.id, params.version),
    create,
    update,
    restoreState
  }
}

export default entityModel
