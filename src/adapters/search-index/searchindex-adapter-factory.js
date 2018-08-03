import NeDbSearchIndexAdapter from './ne-db-search-index-adapter'

const createSearchIndexAdapter = (type) => {
  if (type === 'default') {
    return new NeDbSearchIndexAdapter()
  }

  return type
}

export default createSearchIndexAdapter
