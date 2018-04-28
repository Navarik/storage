import parsePath from 'parse-path'

class DataSoure {
  constructor({ adapters }) {
    this.adapters = adapters
  }

  getAdapter(protocol) {
    if (!this.adapters[protocol]) {
      throw new Error(`[DataSource] datasources of type ${protocol} are not supported`)
    }

    return this.adapters[protocol]
  }

  read(path) {
    const parsed = parsePath(path)
    const adapter = this.getAdapter(parsed.protocol)

    return adapter.readAllFiles(parsed)
  }
}

export default DataSoure
