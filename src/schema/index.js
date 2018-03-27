import uuidv5 from 'uuid/v5'
import { empty, unique, diff, get, head } from '../utils'
import { BadRequestError, ConflictError } from '../errors'
import VersionedStorage from '../versioned-storage'

class SchemaModel extends VersionedStorage {
  constructor(config) {
    super({
      // Generate same ID for the same schema names
      idGenerator: body => uuidv5(`${body.namespace}.${body.name}`, config.rootUuid),
      ...config
    })
  }

  async getNamespaces() {
    const schemas = await super.find({})
    const namespaces = unique(schemas.map(get('namespace')))

    return namespaces
  }

  async create(body) {
    const found = await this.findOne(body.id)
    if (found) {
      throw new ConflictError(`Schema already exists: ${id}`)
    }

    const result = await super.create(body)

    return result
  }

  async update(id, newBody) {
    const found = await this.get(id)
    if (!found) {
      throw new BadRequestError(`Schema not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      throw new BadRequestError(res, 'Schema versions are identical')
    }

    const result = await super.update(found, newBody)

    return result
  }
}

export default SchemaModel
