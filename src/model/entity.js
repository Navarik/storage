import uuidv4 from 'uuid/v4'
import { map, get, unique, indexBy, pipe, head, empty, diff } from '../utils'
import { BadRequestError } from '../errors'
import VersionedStorage from './versioned-storage'
import format from './format-entity'
import { split, combine } from './type-naming'

const enforceArray = body => (body instanceof Array ? body : [body])
const createType = combine('.')
const splitType = split('.')

class EntityModel extends VersionedStorage {
  constructor(config, schemaModel) {
    super({
      idGenerator: () => uuidv4(), // Random unique identifier
      ...config
    })
    this.schemaModel = schemaModel
  }

  async getSchemata(entities) {
    const types = unique(entities.map(pipe(get('type'), splitType)))
    const schemata = await Promise.all(types.map(type => this.schemaModel.findOne(type)))

    return schemata
  }

  async formatCollection(entities) {
    const schema = await this.getSchemata(entities)
    const indexedSchemata = indexBy(createType, schema)
    const data = entities.map(x => format(indexedSchemata[x.type], x))

    return { data, schema }
  }

  async find(params) {
    const entities = await super.find(params)
    const response = await this.formatCollection(entities)

    return response
  }

  async findAll(params) {
    const entities = await super.findAll(params)
    const response = await this.formatCollection(entities)

    return response
  }

  async findOne(id, version) {
    const entity = await super.findOne({ id }, version)
    if (!entity) {
      return undefined
    }

    const schema = await this.schemaModel.findOne(splitType(entity.type))
    const data = format(schema, entity)

    return { data, schema }
  }

  async create(body) {
    const entities = enforceArray(body)
    const response = await this.formatCollection(entities)
    response.data = await super.createAll(response.data)

    return response
  }

  async update(id, newBody) {
    const found = await this.findOne(id)
    if (!found) {
      throw new BadRequestError(`Entity not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      throw new BadRequestError(res, 'Versions are identical')
    }

    // @todo support schema migrations
    const data = await super.update(found.data, format(found.schema, newBody))

    return { data, schema: found.schema }
  }
}

export default EntityModel
