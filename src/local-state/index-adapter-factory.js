import NeDbIndexAdapter from './ne-db-index-adapter'

const createIndexAdapter = (adapter) => {
  if (adapter === 'default') {
    return new NeDbIndexAdapter()
  }

  return adapter
}

export default createIndexAdapter
