import { liftToArray, maybe } from '../utils'

export const briefEntityView = () => maybe(liftToArray(data => ({
  ...data.body,
  id: data.id,
  type: data.type
})))
