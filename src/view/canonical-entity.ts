import { liftToArray, maybe } from '../utils'

export const canonicalEntityView = (schemaRegistry) => maybe(liftToArray(data => ({
  ...data,
  schema: data.type ? schemaRegistry.get(data.type).schema() : {}
})))
