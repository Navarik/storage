import NeDbIndexAdapter from './ne-db-index-adapter'

const createIndexAdapter = (type) => {
  if (type === 'default') {
    return new NeDbIndexAdapter()
  }

  return type
}

export default createIndexAdapter
