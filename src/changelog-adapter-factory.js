// @flow
import { EventEmitterQueueAdapter } from './adapters/change-log'

const createChangelogAdapter = (type: any, namespace: string) => {
  if (type === 'default') {
    return new EventEmitterQueueAdapter({})
  } else if (type instanceof Array) {
    return new EventEmitterQueueAdapter({ log: type })
  }

  return type
}

export default createChangelogAdapter
