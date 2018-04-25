import { on, off, send } from './adapters/queue'
import uuidv4 from 'uuid/v4'

const CHANGE_EVENT = 'change'
const versions = {}

export const latestVersion = id => versions[id] || {}

on(CHANGE_EVENT, ({ payload }) => versions[payload.id] = payload)

export const record = (payload) => {
  const requestId = uuidv4()
  const result = new Promise((resolve, reject) => {
    const resolver = x => {
      if (x.requestId === requestId) {
        off(CHANGE_EVENT, resolver)
        resolve(x.payload)
      }
    }

    on(CHANGE_EVENT, resolver)
  })

  send(CHANGE_EVENT, { requestId, payload })

  return result
}

export const observe = func => on(CHANGE_EVENT, func)
export const unobserve = func => off(CHANGE_EVENT, func)
