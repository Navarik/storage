import { formatEntity } from '../schema/registry'
import * as changeLog from '../change-log'

export const createEntity = async body => {
  const response = formatEntity(body)
  response.data = await changeLog.request('create', response.data)

  return response
}

export const updateEntity = async (id, body) => {
  const response = await schemaModel.format(req.body)
  response.data = await entityModel.update(req.params.id, response.data)

  return response
}
