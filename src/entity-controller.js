import unique from 'array-unique'
import flatten from 'array-flatten'
import * as entityModel from './models/entity'
import * as schemaModel from './models/schema'
import { badRequestError, created } from './utils'
import format from './format'

const schemaId = x => `${x.namespace}.${x.name}`
const indexById = xs => xs.reduce((acc, x) => ({ ...acc, [schemaId(x)]: x }), {})

async function queryEntities(req) {
  const data = await entityModel.find(req.params)
  const types = unique(data.map(x => x.type))
  const schema = await Promise.all(types.map(schemaModel.get))

  return { data, schema }
}

async function queryNamespace(req) {
  const { namespace, ...searchParams } = req.params
  const schema = await schemaModel.find({ namespace }) || []
  const data = await Promise.all(
    schemata.map(schemaId).map(type => entityModel.find({ ...searchParams, type }))
  )

  return { data: flatten(data), schema }
}

export const findEntities = req => (req.params.namespace
  ? queryNamespace(req)
  : queryEntities(req)
)

export async function getEntity(req, res) {
  const entity = await entityModel.get(req.params.id, req.params.v)
  if (entity === undefined) {
    return undefined
  }

  const schema = await schemaModel.get(data.type)
  const data = format(schema, entity)

  return { data, schema }
}

export async function createEntity(req, res) {
  const collection = (req.body instanceof Array ? req.body : [req.body])
  const types = unique(collection.map(x => x.type))

  const schema = await Promise.all(types.map(schemaModel.get)).then(indexById)
  const formatted = collection.map(x => format(schema[x.type], x))
  const data = await entityModel.createAll(collection)

  return created(res, { data, schema })
}

export async function updateEntity(req, res) {
  const old = await entityModel.get(req.params.id)
  if (!old) {
    return undefined
  }

  const type = req.body.type || old.type
  const schema = await schemaModel.get(type)
  if (!schema) {
    return badRequestError(res, `Schema not found for type: ${type}`)
  }

  const data = await entityModel.update(req.params.id, format(schema, req.body))

  return { data, schema }
}