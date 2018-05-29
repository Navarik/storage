// @flow
import { NeDbSearchIndexAdapter } from './adapters/search-index'
import SearchIndex from './ports/search-index'

import type { SearchIndexAdapterInterface } from './flowtypes'

const createSearchIndex = (conf: any) => {
  let adapter: SearchIndexAdapterInterface = conf
  if (conf === 'default') {
    adapter = new NeDbSearchIndexAdapter()
  }

  return new SearchIndex({ adapter })
}

export default createSearchIndex
