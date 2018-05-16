import uuidv4 from 'uuid/v4'
import { map, liftToArray } from '../utils'
import schemaRegistry from './schema-registry'

const generateId = body => uuidv4()

const searchableFormat = liftToArray(data => ({
  id: data.id,
  version: data.version,
  version_id: data.version_id,
  type: data.type,
  ...map(x => String(x), data.payload)
}))

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
    const entity = schemaRegistry.format(type, body)
    const id = generateId()

    const entityRecord = await changeLog.logNew(type, id, entity)
    await searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
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
    get: (id, version) => searchIndex.getLatest(id),
    // getVersion: params => searchIndex.getVersion(params.id, params.version),
    create,
    update,
    init
  }
}

export default entityModel
