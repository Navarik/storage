// @flow
import eventEmitter from 'event-emitter'

import type { QueueAdapterInterface, Observer } from '../../flowtypes'

class EventEmitterQueueAdapter implements QueueAdapterInterface {
  emitter: Object
  log: Array<Object>

  constructor(config: Object) {
    this.emitter = eventEmitter()
    this.log = config.log || []
  }

  on(topic: string, handler: Observer) {
    this.emitter.on(topic, handler)
  }

  send(topic: string, message: Object) {
    this.emitter.emit(topic, message)

    return Promise.resolve(message)
  }

  getLog(topic: string) {
    return Promise.resolve(this.log)
  }
}

export default EventEmitterQueueAdapter
