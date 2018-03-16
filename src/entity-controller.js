import unique from 'array-unique'
import exclude from 'poly-exclude'
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
  const searchParams = exclude(['namespace'], req.params)
  const schema = await schemaModel.find({ namespace: req.params.namespace }) || []
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
  const data = await entityModel.get(req.params.id, req.params.v)
  if (data === undefined) {
    return undefined
  }

  const schema = await schemaModel.get(data.type)

  return { data, schema }
}

async function createOneEntity(req, res) {
  const typeName = req.body.type
  const schema = await schemaModel.get(typeName)
  const data = await entityModel.create(format(schema, req.body))

  return created(res, { data, schema })
}

async function createCollection(req, res) {
  const allSchemata = await Promise.all(req.body.map(x => schemaModel.get(x.type)))
  const schema = indexById(unique(allSchemata))
  const data = await Promise.all(req.body.map(x => entityModel.create(format(schema[x.type], x))))

  return created(res, { data, schema })
}

export const createEntity = (req, res) => (req.body instanceof Array
  ? createCollection(req, res)
  : createOneEntity(req, res)
)

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