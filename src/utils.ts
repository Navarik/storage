import * as path from 'object-path'
import { StringMap } from '@navarik/types'
import { Observer } from './types'

export const whenMatches = (filter: StringMap, handler: Observer<any>) => (data: any) => {
  for (const fieldName in filter) {
    if (path.get(data, fieldName) !== filter[fieldName]) {
      return
    }
  }

  handler(data)
}
