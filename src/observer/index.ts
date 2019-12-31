import { createListener } from './listener'

export class Observer {
  private listeners

  constructor() {
    this.listeners = []
  }

  listen(filter, handler) {
    this.listeners.push(createListener(filter, handler))
  }

  async emit(event) {
    await Promise.all(this.listeners.map(listener => listener(event)))
  }
}
