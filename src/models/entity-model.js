import uuidv4 from 'uuid/v4'
import { map, liftToArray, head, maybe } from '../utils'
import schemaRegistry from './schema-registry'

const generateId = body => uuidv4()
const stringifyProperties = map(x => String(x))

const searchableFormat = liftToArray(data => ({
  id: data.id,
  version: String(data.version),
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

  // Queries
  const find = async (params) => {
    const found = await searchIndex.findLatest(stringifyProperties(params))
    const entities = found.map(x => changeLog.getLatestVersion(x.id))

    return entities
  }

  const get = (id, version) => {
    if (!version) {
      return Promise.resolve(changeLog.getLatestVersion(id))
    }

    return searchIndex
      .findVersions(stringifyProperties({ id, version }))
      .then(head)
      .then(maybe(x => changeLog.getVersion(x.version_id)))
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
    const { type } = changeLog.getLatestVersion(id)

    const validationErrors = schemaRegistry.validate(type, body)
    if (validationErrors.length) {
      throw new Error(`[Entity] Invalid value provided for: ${validationErrors.join(', ')}`)
    }

    const entity = schemaRegistry.format(type, body)

    const entityRecord = await changeLog.logChange(id, entity)
    await searchIndex.add(searchableFormat(entityRecord))

    return entityRecord
  }

  // API
  return {
    find,
    get,
    create,
    update,
    init,
    validate
  }
}

export default entityModel
