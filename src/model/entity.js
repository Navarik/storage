import { splitName, map, get, unique, indexBy } from '../utils'
import { BadRequestError } from '../errors'
import VersionedStorage from './versioned-storage'
import format from './format-entity'

class EntityModel extends VersionedStorage {
  constructor(config, schemaModel) {
    super(config)
    this.schemaModel = schemaModel
  }

  async getSchemata(entities) {
    const types = unique(entities.map(get('type')))
    const schemata = await Promise.all(types.map(type => this.schemaModel.findOne(type)))

    return schemata
  }

  async formatCollection(entities) {
    const schema = await this.getSchemata(entities)
    const indexedSchemata = indexBy(get('id'), schema)
    const data = entities.map(x => format(indexedSchemata[x.type], x))

    return { data, schema }
  }

  async find(params) {
    const entities = await super.find(params)
    const response = await this.formatCollection(entities)

    return response
  }

  async create(body) {
    const entities = (body instanceof Array ? body : [body])
    const response = await this.formatCollection(entities)
    response.data = await super.createAll(response.data)

    return response
  }

  async findOne(id, version) {
    const entity = await super.findOne({ _id: id }, version)
    if (!entity) {
      return undefined
    }

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
