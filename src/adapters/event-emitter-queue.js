// @flow
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

  on(name: string, handler) {
    return this.emitter.on(name, handler)
  }

  send(name: string, payload) {
    return this.emitter.emit(name, payload)
  }

  getLog(name: string) {
    return []
  }
}

export default EventEmitterQueueAdapter
