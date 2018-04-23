import uuidv5 from 'uuid/v5'
import { pipe, map, get, empty, unique, diff, head, enforceArray } from './utils'
import { BadRequestError, ConflictError } from './errors'
import VersionedStorage from './versioned-storage'
import { split, combine } from './type-naming'
import { formatCollection } from './view'

const createType = combine('.')
const splitType = split('.')
const extractTypes = pipe(map(get('type')), unique, map(splitType))

class SchemaModel extends VersionedStorage {
  constructor(config) {
    super({
      // Generate same ID for the same schema names
      idGenerator: body => uuidv5(`${createType(body)}`, config.rootUuid),
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

  async format(entities) {
    const collection = enforceArray(entities)
    const types = extractTypes(collection)
    const schema = await Promise.all(types.map(type => this.findOne(type)))
    const data = formatCollection(schema, collection)

    if (entities instanceof Array) {
      return { data, schema }
    } else {
      return { data: head(data), schema: head(schema) }
    }
  }
}

export default SchemaModel
