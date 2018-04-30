import createGit from 'simple-git'
import logger from 'logops'
import fileExtension from 'file-extension'
import { flatten } from '../utils'
import parse from './content-parser'
import FilesystemDatasourceAdapter from './filesystem'

const CHECKOUT_LOCATION = 'storage_source'

class GitDatasourceAdapter {
  constructor({ workingDirectory, format }) {
    this.git = createGit(workingDirectory)
    this.fs = new FilesystemDatasourceAdapter({ root: workingDirectory, format })
  }

  readAllFiles(location) {
    this.fs.clean()
    const uri = `${location.protocols[1]}://${location.resource}${location.pathname}`

    return new Promise((resolve, reject) => {
      this.git.clone(uri, CHECKOUT_LOCATION, [], () => {
        resolve(this.fs.readAllFiles({ pathname: CHECKOUT_LOCATION }))
      })
    })
  }
}

export default GitDatasourceAdapter
