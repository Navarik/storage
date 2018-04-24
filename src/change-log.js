import { on, off, emit } from './adapters/queue'
import uuidv4 from 'uuid/v4'

export const request = (type, payload) => {
  const requestId = uuidv4()
  const result = new Promise((resolve, reject) => {
    const resolver = x => {
      if (x.requestId === requestId) {
        off('change', resolver)
        resolve(x.payload)
      }
    }

    on('change', resolver)
  })

  emit('request', { requestId, type, payload })

  return result
}

export const handle = (type, handler) =>
  on('request', async (req) => {
    if (req.type === type) {
      emit('change', {
        requestId: req.requestId,
        payload: await handler(req.payload)
      })
    }
  })
