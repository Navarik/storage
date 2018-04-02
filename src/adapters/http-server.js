import logger from 'logops'
import express from 'express'
import bodyParser from 'body-parser'
import expressLogging from 'express-logging'
import cors from 'cors'

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

const server = express()
const healthChecks = []

// CORS
server.use(cors())

// support application/json
server.use(bodyParser.json())

// Logging
server.use(expressLogging(logger))

// Misc
server.disable('x-powered-by')

// Maintanance endpoints
server.get('/health', (req, res) => {
  const failedChecks = healthChecks.filter(check => !check.func())

  if (failedChecks.length) {
    res.status(500).json({
      status: 'error',
      details: failedChecks.map(check => check.message)
    })
  } else {
    res.json({ status: 'ok' })
  }
})

// Module API
server.addHealthCheck = (func, message) => healthChecks.push({ func, message })
server.mount = (method, route, handler) => server[method](route, controller(handler))

server.start = (port) => server.listen(port, () =>
  logger.info(`Server listening on port ${port}`)
)

export default server
