import { splitName, map, get, unique, indexBy } from '../utils'
import { BadRequestError } from '../errors'
import VersionedStorage from './versioned-storage'
import format from './format-entity'

class EntityModel extends VersionedStorage {
  constructor(config, schemaModel) {
    super()
    this.config = config
    this.schemaModel = schemaModel
  }

  connect(config) {
    return super.connect(config || this.config)
  }

  async getSchemata(entities) {
    const types = unique(entities.map(get('type')))
    const schemata = await Promise.all(types.map(this.schemaModel.findOne))
    const result = indexBy(get('id'), schemata)

    return result
  }

  async formatCollection(entities) {
    const schema = await this.getSchemata(entities)
    const data = entities.map(x => format(schema[x.type], x))

    return { data, schema }
  }

  async find(params) {
    const entities = await super.find(params)
    const response = this.formatCollection(entities)

    return response
  }

  async create(body) {
    const entities = (body instanceof Array ? body : [body])
    const response = this.formatCollection(entities)
    response.data = await super.createAll(response.data)

    return response
  }

  async findOne(id, version) {
    const entity = await super.findOne(id, version)
    const schema = await this.schemaModel.findOne(entity.type)
    const data = format(schema, entity)

    return { data, schema }
  }

  async update(id, newBody) {
    const found = await this.findOne(id)
    if (!found) {
      return BadRequestError(`Entity not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      return BadRequestError(res, 'Versions are identical')
    }

    const type = newBody.type || found.type
    const schema = await getSchema(type)
    const data = await super.update(found, format(schema, newBody))

    return { data, schema }
  }
}

export default EntityModel
