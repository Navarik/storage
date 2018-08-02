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
    const response = await this.listener({ ...document, type: topic })

    return response
  }
}

export default ChangeLog
