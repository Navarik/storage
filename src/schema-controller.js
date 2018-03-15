import * as schemaModel from './schema'
import { conflictError, created } from './utils'

export const findSchemas = req => schemaModel.find(req.params)

export const getSchema = req => schemaModel.get(req.params.id, req.params.v)

export const createSchema = (req, res) => schemaModel
  .create(req.body)
  .then(created(res))
  .catch(conflictError(res))

export const updateSchema = (req, res) => schemaModel.update(req.params.id, req.body)
