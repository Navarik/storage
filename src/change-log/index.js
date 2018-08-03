import arraySort from 'array-sort'
import SignatureProvider from './signature-provider'

class ChangeLog {
  constructor(adapter, generateId) {
    this.adapter = adapter
    this.signature = new SignatureProvider(generateId)
    this.listener = () => {}
  }

  onChange(func) {
    this.listener = func
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  async reconstruct(topic) {
    await this.adapter.init()
    let log = await this.adapter.read(topic)
    log = log.map(record => (record.id ? record : this.signature.signNew(record)))
    log = arraySort(log, 'version')

    return log
  }

  async registerNew(type, document) {
    const record = this.signature.signNew(document)
    await this.adapter.write(type, record)
    const response = await this.listener({ ...record, type })

    return response
  }

  async registerUpdate(type, oldVersion, document) {
    const newVersion = this.signature.signVersion(document, oldVersion)
    if (oldVersion.version_id === newVersion.version_id) {
      return previous
    }

    await this.adapter.write(type, newVersion)
    const response = await this.listener({ ...newVersion, type })

    return response
  }
}

export default ChangeLog
