import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

class ChangeLog {
  constructor(adapter) {
    this.adapter = adapter
    this.listener = () => {}
  }

  onChange(func) {
    this.listener = func
  }

  async reconstruct(topic) {
    let log = await this.adapter.read(topic)
    log = arraySort(log, 'version')

    return log
  }

  async register(topic, document) {
    await this.adapter.write(topic, document)
    this.listener({ ...document, type: topic })

    return document
  }
}

export default ChangeLog
