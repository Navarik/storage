//@flow
import { readAllFiles } from './filesystem'

import type { DataSourceAdapterInterface, Location } from '../../flowtypes'

type Configuration = {
  format: string
}

class FilesystemDatasourceAdapter implements DataSourceAdapterInterface {
  format: string

  constructor(config: Configuration) {
    this.format = config.format
  }

  readAllFiles(location: Location) {
    return Promise.resolve(readAllFiles(location.pathname, this.format))
  }
}

export default FilesystemDatasourceAdapter
