import createGit from 'simple-git'
import fileExtension from 'file-extension'
import { clean, getFileNames, readFile } from './filesystem'

const CHECKOUT_LOCATION = 'storage_source'

class GitDatasourceAdapter {
  constructor({ workingDirectory, format }) {
    this.workingDirectory = workingDirectory
    this.format = format
    this.git = createGit(workingDirectory)
  }

  readAllFiles(location) {
    clean()
    const uri = `${location.protocols[1]}://${location.resource}${location.pathname}`
    const pathname = `${this.workingDirectory}/${CHECKOUT_LOCATION}`

    return new Promise((resolve, reject) => {
      this.git.clone(uri, CHECKOUT_LOCATION, [], () => {
        resolve(getFileNames(pathname)
          .filter(name => (!this.format || fileExtension(name) === this.format))
          .map(name => readFile(name))
        )
      })
    })
  }
}

export default GitDatasourceAdapter
