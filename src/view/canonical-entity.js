import { liftToArray } from '../utils'

const canonicalEntityView = (schemaRegistry) => liftToArray(data => ({
  ...data,
  schema: schemaRegistry.get(data.type).schema()
}))

export default canonicalEntityView
