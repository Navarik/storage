import * as schemaModel from './models/schema'
import { conflictError, created } from './utils'

export const findSchemas = req => schemaModel.find(req.params)

export const getSchema = req => schemaModel.get(req.params.id, req.params.v)

export const createSchema = async (req, res) => {
  const id = `${req.body.namespace}.${req.body.name}`
  const found = await schemaModel.get(id)

  if (found) {
    return conflictError(res, `Schema already exists: ${id}`)
  }

  const result = await schemaModel.create(req.body)

  return created(res, result)
}

export const updateSchema = (req, res) => schemaModel.update(req.params.id, req.body)
