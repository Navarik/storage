//@flow
import createGit from 'simple-git'
import fileExtension from 'file-extension'
import { clean, readAllFiles } from './filesystem'

import type { DataSourceAdapterInterface, Location } from '../../flowtypes'

const CHECKOUT_LOCATION = 'storage_source'

type Configuration = {
  format: string,
  workingDirectory: string
}

class GitDatasourceAdapter implements DataSourceAdapterInterface {
  workingDirectory: string
  format: string
  git: Object

  constructor(config: Configuration) {
    this.workingDirectory = config.workingDirectory
    this.format = config.format
    this.git = createGit(config.workingDirectory)
  }

  readAllFiles(location: Location) {
    clean(this.workingDirectory)
    const uri = `${location.protocols[1]}://${location.resource}${location.pathname}`
    const pathname = `${this.workingDirectory}/${CHECKOUT_LOCATION}`

    return new Promise((resolve, reject) => {
      this.git.clone(uri, CHECKOUT_LOCATION, [], () => {
        resolve(readAllFiles(pathname, this.format))
      })
    })
  }
}

export default GitDatasourceAdapter
