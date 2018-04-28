import fs from 'fs'
import logger from 'logops'
import fileExtension from 'file-extension'
import { flatten } from '../utils'
import parse from './content-parser'


const readFile = (directory, fileName) => {
  try {
    const content = fs.readFileSync(`${directory}/${fileName}`, 'utf8')
    return parse(fileExtension(fileName), content)
  }
  catch (error) {
    logger.error(`[Filesystem] Error reading file: [${fileName}], error: [${error}]`)
    process.exit(1)
  }
}

class FilesystemDatasourceAdapter {
  constructor({ root }) {
    this.root = root
  }

  getFileNames(directory = '') {
    return fs.readdirSync(`${this.root}/${directory}`)
  }

  readAllFiles(location) {
    const directory = `${this.root}/${location.pathname}`
    return flatten(getFileNames(directory).map(name => readFile(directory, name)))
  }
}

export default FilesystemDatasourceAdapter
