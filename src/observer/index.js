import createListener from './listener'

class Observer {
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

export default Observer
