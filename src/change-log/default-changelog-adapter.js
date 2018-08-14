import map from 'poly-map'

class DefaultChangelogAdapter {
  constructor(config) {
    this.observer = () => {}
    this.log = config.log || {}
  }

  observe(handler) {
    this.observer = handler
  }

  write(message) {
    return this.observer(message)
  }

  async init(types, signatureProvider) {
    await map(async (type) => {
      if (this.log[type]) {
        for (let data of this.log[type]) {
          const record = data.id ? data : signatureProvider.signNew(type, data)
          await this.write(record)
        }
      }
    }, types)
  }

  isConnected() {
    return true
  }
}

export default DefaultChangelogAdapter
