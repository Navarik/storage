import eventEmitter from 'event-emitter'

const queue = eventEmitter()

export const on = (name, handler) => queue.on(name, handler)
export const off = (name, handler) => queue.off(name, handler)
export const send = (name, payload) => queue.emit(name, payload)
