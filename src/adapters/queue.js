import uuidv4 from 'uuid/v4'
import eventEmitter from 'event-emitter'

const queue = eventEmitter()

export const on = (name, handler) => queue.on(name, handler)
export const off = (name, handler) => queue.off(name, handler)
export const send = (name, payload) => queue.emit(name, payload)

export const request = (name, payload) => {
  const requestId = uuidv4()
  const promisedResult = new Promise((resolve, reject) => {
    const resolver = message => {
      if (message.requestId === requestId) {
        off(name, resolver)
        resolve(message.payload)
      }
    }

    on(name, resolver)
  })

  send(name, { requestId, payload })

  return promisedResult
}
