// @flow
import DefaultChangelogAdapter from './event-emitter'

const createChangelogAdapter = (type) => {
  if (type === 'default') {
    return new DefaultChangelogAdapter({})
  } else if (type.constructor === Object) {
    return new DefaultChangelogAdapter({ log: type })
  }

  return type
}

export default createChangelogAdapter
