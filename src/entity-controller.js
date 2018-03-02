import unique from 'array-unique'
import exclude from 'poly-exclude'
import flatten from 'array-flatten'
import * as entityModel from '@navarik/entity-core'
import * as schemaModel from '@navarik/schema-core'
import { badRequestError, created } from './utils'
import format from './format'

const schemaId = x => `${x.namespace}.${x.name}`

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

export async function createEntity(req, res) {
  const typeName = req.body.type
  if (!typeName) {
    return badRequestError(res, 'No type specified')
  }

  const schema = await schemaModel.get(typeName)
  if (!schema) {
    return badRequestError(res, `Schema not found for type: ${typeName}`)
  }

  const data = await entityModel.create(format(schema, req.body))

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