// @flow
import eventEmitter from 'event-emitter'

import type { ChangelogAdapterInterface, Observer } from '../../flowtypes'

class DefaultChangelogAdapter implements ChangelogAdapterInterface {
  emitter: Object
  log: { [string]: Array<Object> }

  constructor(config: Object) {
    this.emitter = eventEmitter()
    this.log = config.log || {}
  }

  on(topic: string, handler: Observer) {
    this.emitter.on(topic, handler)
  }

  write(topic: string, message: Object) {
    this.emitter.emit(topic, message)

    return Promise.resolve(message)
  }

  read(topic: string) {
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
