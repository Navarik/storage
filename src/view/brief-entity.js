import { liftToArray, maybe } from '../utils'

const briefEntityView = (schemaRegistry) => maybe(liftToArray(data => ({
  ...data.body,
  id: data.id,
  type: data.type
})))

export default briefEntityView
