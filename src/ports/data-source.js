//@flow
import parsePath from 'parse-path'

import type { DataSourceInterface, DataSourceAdapterInterface } from '../flowtypes'

class DataSoure implements DataSourceInterface {
  adapters: { [string]: DataSourceAdapterInterface }

  constructor(config: Object) {
    this.adapters = config.adapters
  }

  getAdapter(protocol: string): DataSourceAdapterInterface {
    if (!this.adapters[protocol]) {
      throw new Error(`[DataSource] datasources of type ${protocol} are not supported`)
    }

    return this.adapters[protocol]
  }

  read(path: ?string) {
    const parsed = parsePath(path)
    const adapter = this.getAdapter(parsed.protocol)

    if (!path) {
      return Promise.resolve(undefined)
    }

    return adapter.readAllFiles(parsed)
  }
}

export default DataSoure
