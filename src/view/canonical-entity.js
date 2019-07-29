import { liftToArray, maybe } from '../utils'

const canonicalEntityView = (schemaRegistry) => maybe(liftToArray(data => ({
  ...data,
  schema: data.type ? schemaRegistry.get(data.type).schema() : {}
})))

export default canonicalEntityView
