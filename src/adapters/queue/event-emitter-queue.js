// @flow
import eventEmitter from 'event-emitter'

import type { QueueAdapterInterface, Observer, QueueMessage } from '../../flowtypes'

class EventEmitterQueueAdapter implements QueueAdapterInterface {
  emitter: Object

  constructor() {
    this.emitter = eventEmitter()
  }

  connect() {
    return Promise.resolve(this.emitter)
  }

  isConnected() {
    return true
  }

  on(topic: string, handler: Observer) {
    this.emitter.on(topic, handler)
  }

  send(topic: string, message: QueueMessage) {
    this.emitter.emit(topic, message)
  }

  getLog(topic: string) {
    return Promise.resolve([])
  }
}

export default EventEmitterQueueAdapter
