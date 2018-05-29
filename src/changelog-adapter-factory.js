// @flow
import { DefaultChangelogAdapter } from './adapters/change-log'

const createChangelogAdapter = (type: any, namespace: string) => {
  if (type === 'default') {
    return new DefaultChangelogAdapter({})
  } else if (type instanceof Object) {
    return new DefaultChangelogAdapter({ log: type })
  }

  return type
}

export default createChangelogAdapter
