import uuidv4 from 'uuid/v4'
import { map, get, unique, indexBy, pipe, head, empty, diff } from '../utils'
import { BadRequestError } from '../errors'
import VersionedStorage from '../versioned-storage'
import formatEntity from './format'
import { split, combine } from './type-naming'

const enforceArray = body => (body instanceof Array ? body : [body])
const createType = combine('.')
const splitType = split('.')
const extractTypes = pipe(map(get('type')), unique, map(splitType))

const formatCollection = (schema, entities) => {
  const schemaIndex = indexBy(createType, schema)
  const collection = entities.map(x => formatEntity(schemaIndex[x.type], x))

  return collection
}

class EntityModel extends VersionedStorage {
  constructor(config, schemaModel) {
    super({
      idGenerator: () => uuidv4(), // Random unique identifier
      ...config
    })
    this.schemaModel = schemaModel
  }

  async extractSchemata(entities) {
    const types = extractTypes(entities)
    const schemata = await Promise.all(types.map(type => this.schemaModel.findOne(type)))

    return schemata
  }

  async find(params, castType) {
    const entities = await super.find(params)
    let schema, data

    if (castType) {
      schema = await this.schemaModel.findOne(splitType(castType))
      data = entities.map(formatEntity(schema))
    } else {
      schema = await this.extractSchemata(entities)
      data = formatCollection(schema, entities)
    }

    return { data, schema: enforceArray(schema) }
  }

  async findAll(params) {
    const entities = await super.findAll(params)
    const schema = await this.extractSchemata(entities)
    const data = formatCollection(schema, entities)

    return { data, schema }
  }

  async findOne(id, version) {
    const entity = await super.findOne({ id }, version)
    if (!entity) {
      return undefined
    }

    const schema = await this.schemaModel.findOne(splitType(entity.type))
    const data = formatEntity(schema, entity)

    return { data, schema }
  }

  async create(body) {
    const entities = enforceArray(body)
    const schema = await this.extractSchemata(entities)
    const collection = formatCollection(schema, entities)
    const data = await super.createAll(collection)

    return { data, schema }
  }

  async update(id, newBody) {
    const found = await this.findOne(id)
    if (!found) {
      throw new BadRequestError(`Entity not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      throw new BadRequestError(res, 'Versions are identical')
    }

    // @todo support schema migrations
    const data = await super.update(found.data, formatEntity(found.schema, newBody))

    return { data, schema: found.schema }
  }
}

export default EntityModel
