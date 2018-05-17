import uuidv4 from 'uuid/v4'
import { map, liftToArray } from '../utils'
import schemaRegistry from './schema-registry'

const generateId = body => uuidv4()
const stringifyProperties = map(x => String(x))

const searchableFormat = liftToArray(data => ({
  id: data.id,
  version: data.version,
  version_id: data.version_id,
  type: data.type,
  ...stringifyProperties(data.payload)
}))

const entityModel = (config) => {
  const searchIndex = config.searchIndex
  const dataSource = config.dataSource
  const changeLog = config.changeLog

  const init = async () => {
    const log = await changeLog.reconstruct()
    await searchIndex.init(log)
  }

  const find = async (params) => {
    const found = await searchIndex.findLatest(stringifyProperties(params))
    const entities = found.map(x => changeLog.getLatestVersion(x.id))

    return entities
  }

  // Commands
  const validate = (type, body) => {
    const validationErrors = schemaRegistry.validate(type, body)
    const isValid = (validationErrors.length === 0)

    return isValid
  }

  const create = async (type, body) => {
    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

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
    find,
    get: (id, version) => searchIndex.getLatest(id),
    // getVersion: params => searchIndex.getVersion(params.id, params.version),
    create,
    update,
    init,
    validate
  }
}

export default entityModel
