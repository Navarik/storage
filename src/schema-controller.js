import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import * as schemaModel from './model/schema'
import { conflictError, badRequestError, created, empty, splitName } from './utils'

export const getNamespaces = () => schemaModel.find({})
  .then(xs => xs.map(x => x.namespace))
  .then(unique)

export const findSchemas = req => schemaModel.find(req.params)

export const getSchema = req => schemaModel.findOne(splitName('.', req.params.id), req.params.v)

export const createSchema = async (req, res) => {
  const found = await schemaModel.findOne({ name: req.body.name, namespace: req.body.namespace })

  if (found) {
    return conflictError(res, `Schema already exists: ${req.body.namespace}.${req.body.name}`)
  }

  const result = await schemaModel.create(req.body)

  return created(res, result)
}

export const updateSchema = async (req, res) => {
  const found = await schemaModel.findOne(splitName('.', req.params.id))

  if (!found) {
    return badRequestError(res, `Schema not found: ${req.params.id}`)
  }

  if (empty(diff(found, req.body))) {
    return badRequestError(res, 'Schema versions are identical')
  }

  const { namespace, name } = splitName('.', req.params.id)
  const newVersion = { namespace, name, ...req.body, version: found.version + 1 }

  const result = await schemaModel.update(found, newVersion)

  return result
}
