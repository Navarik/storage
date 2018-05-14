import uuidv4 from 'uuid/v4'
import schemaRegistry from './schema-registry'

const generateId = body => uuidv4()

const entityModel = (config) => {
  const searchIndex = config.searchIndex
  const dataSource = config.dataSource
  const changeLog = config.changeLog

  const init = async () => {
    const log = await changeLog.reconstruct()
    await searchIndex.init(log)
  }

  // Commands
  const create = async (body) => {
    const entity = schemaRegistry.format(body)

    const id = generateId()
    entity.data = await changeLog.logNew(id, 'entity', entity.data)
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
    init
  }
}

export default entityModel
