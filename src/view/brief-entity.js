import { liftToArray } from '../utils'

const briefEntityView = (schemaRegistry) => liftToArray(data => ({
  ...data.body,
  id: data.id,
  type: data.type
}))

export default briefEntityView
