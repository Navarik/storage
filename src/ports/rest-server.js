import logger from 'logops'
import server from '../adapters/http-server'

const controller = handler => (req, res) => {
  const params = { ...(req.params || {}), ...(req.query || {}) }

  return handler({ params, body: req.body }, res)
    .then(data => {
      if (data === undefined) {
        res.status(404).send()
      } else {
        res.send(data)
      }
    })
    .catch(err => {
      if (err.code) {
        res.status(err.code).send({ message: err.message })
      } else {
        logger.error(err)
        res.status(500).send({ message: 'System error', details: err.message })
      }
    })
}

// Constroller
server.create = (route, handler) => server.post(route, controller(
  (req, res) => handler(req.body).then(x => { res.status(201); return x })
))

server.update = (route, handler) => server.put(route, controller(
  (req, res) => handler(req.params.id, req.body)
))

server.read = (route, handler) => server.get(route, controller(
  (req, res) => handler(req.params)
))

export default server
