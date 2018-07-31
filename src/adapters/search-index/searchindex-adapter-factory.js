// @flow
import NeDbSearchIndexAdapter from './ne-db-search-index-adapter'

const createSearchIndexAdapter = (type: any) => {
  if (type === 'default') {
    return new NeDbSearchIndexAdapter()
  }

  return type
}

export default createSearchIndexAdapter
