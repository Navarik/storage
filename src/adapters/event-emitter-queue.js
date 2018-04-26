import eventEmitter from 'event-emitter'

class EventEmitterQueueAdapter {
  constructor() {
    this.emitter = eventEmitter()
  }

  connect() {
    return Promise.resolve(this.emitter)
  }

  isConnected() {
    return true
  }

  on(name, handler) {
    return this.emitter.on(name, handler)
  }

  send(name, payload) {
    return this.emitter.emit(name, payload)
  }
}

export default EventEmitterQueueAdapter
