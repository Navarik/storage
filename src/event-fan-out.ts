import { PubSub, Observer } from './types'

export class EventFanout<T> implements PubSub<T> {
  private listeners: Array<Observer<T>>

  constructor() {
    this.listeners = []
  }

  subscribe(handler: Observer<T>) {
    this.listeners.push(handler)
  }

  async publish(event: T) {
    await Promise.all(this.listeners.map(listener => listener(event)))
  }
}
