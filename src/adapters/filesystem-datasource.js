import fileExtension from 'file-extension'
import { getFileNames, readFile } from './filesystem'

class FilesystemDatasourceAdapter {
  constructor({ format }) {
    this.format = format
  }

  readAllFiles(location) {
    return getFileNames(location.pathname)
      .filter(name => (!this.format || fileExtension(name) === this.format))
      .map(name => readFile(name))
  }
}

export default FilesystemDatasourceAdapter
