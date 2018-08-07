import eventEmitter from 'event-emitter'

class DefaultChangelogAdapter {
  constructor(config) {
    this.emitter = eventEmitter()
    this.log = config.log || {}
  }

  on(topic, handler) {
    this.emitter.on(topic, handler)
  }

  write(topic, message) {
    this.emitter.emit(topic, message)

    return Promise.resolve(message)
  }

  read(topic) {
    return Promise.resolve(this.log[topic] || [])
  }

  init() {
    return Promise.resolve(true)
  }

  isConnected() {
    return true
  }
}

export default DefaultChangelogAdapter
