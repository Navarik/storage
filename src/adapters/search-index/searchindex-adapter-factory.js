// @flow
import NeDbSearchIndexAdapter from './ne-db'

const createSearchIndexAdapter = (type: any) => {
  if (type === 'default') {
    return new NeDbSearchIndexAdapter()
  }

  return type
}

export default createSearchIndexAdapter
