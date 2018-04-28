import createGit from 'simple-git'
import logger from 'logops'
import fileExtension from 'file-extension'
import { flatten } from '../utils'
import parse from './content-parser'
import FilesystemDatasourceAdapter from './filesystem'

class GitDatasourceAdapter {
  constructor({ workingDirectory }) {
    this.git = createGit(workingDirectory)
    this.fs = new FilesystemDatasourceAdapter({ root: workingDirectory })
  }

  readAllFiles(location) {
    const uri = `${location.protocols[1]}://${location.resource}${location.pathname}`

    return new Promise((resolve, reject) => {
      this.git.clone(uri, 'source', [], () => {
        console.log(this.fs.getFileNames('source'))
      })
    })
  }
}

export default GitDatasourceAdapter
