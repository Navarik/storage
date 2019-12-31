import { createListener } from './listener'

export class Observer {
  private listeners

  constructor() {
    this.listeners = []
  }

  listen(filter, handler) {
    this.listeners.push(createListener(filter, handler))
  }

  emit(event) {
    this.listeners.forEach(listener => listener(event))
  }
}
