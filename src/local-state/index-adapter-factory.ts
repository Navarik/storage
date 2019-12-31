import { NeDbIndexAdapter } from './ne-db-index-adapter'

export function createIndexAdapter(adapter) {
  if (adapter === 'default') {
    return new NeDbIndexAdapter()
  }

  return adapter
}
