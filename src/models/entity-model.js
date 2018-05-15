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
  const create = async (type, body) => {
    const formatted = schemaRegistry.format(type, body)

    const id = generateId()
    const entity = await changeLog.logNew(type, id, formatted)
    await searchIndex.add(entity)

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
    find: params => searchIndex.findLatest(params),
    get: id => searchIndex.getLatest(id),
    getVersion: params => searchIndex.getVersion(params.id, params.version),
    create,
    update,
    init
  }
}

export default entityModel
