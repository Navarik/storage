import uuidv5 from 'uuid/v5'
import { exclude, empty, splitName, unique, diff, get, head } from '../utils'
import { BadRequestError, ConflictError } from '../errors'
import VersionedStorage from './versioned-storage'

const UUID_NAMESPACE = '0f090772-9ef8-4a98-e740-bbbf33382dd7'
const fullyQualifiedName = body => `${body.namespace}.${body.name}`

const format = body => ({
  ...exclude(['_id', 'is_latest', 'is_deleted'], body)
})

const normalize = (type, body, version = 1) => ({
  ...splitName('.', type),
  ...body,
  version
})

class SchemaModel extends VersionedStorage {
  constructor(config) {
    super({
      // Generate same ID for the same schema names
      idGenerator: data => uuidv5(fullyQualifiedName(data), UUID_NAMESPACE),
      ...config
    })
  }

  async getNamespaces() {
    const schemas = await super.find({})
    const namespaces = unique(schemas.map(get('namespace')))

    return namespaces
  }

  async find(params) {
    const found = await super.find(params)

    return found.map(format)
  }

  async findOne(id, version) {
    const found = await super.findOne(splitName('.', id), version)

    return found && format(found)
  }

  async create(body) {
    const id = fullyQualifiedName(body)
    const found = await this.findOne(id)
    if (found) {
      throw new ConflictError(`Schema already exists: ${id}`)
    }

    const schema = normalize(id, body)
    const result = await super.create(schema)

    return result
  }

  async update(id, newBody) {
    const found = await this.findOne(id)
    if (!found) {
      throw new BadRequestError(`Schema not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      throw new BadRequestError(res, 'Schema versions are identical')
    }

    const result = await super.update(found, normalize(id, newBody, found.version + 1))

    return format(head(result))
  }
}

export default SchemaModel
