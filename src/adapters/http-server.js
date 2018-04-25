import logger from 'logops'
import express from 'express'
import bodyParser from 'body-parser'
import expressLogging from 'express-logging'
import cors from 'cors'

const expressApp = express()
const healthChecks = []

// CORS
expressApp.use(cors())

// support application/json
expressApp.use(bodyParser.json())

// Logging
expressApp.use(expressLogging(logger))

// Misc
expressApp.disable('x-powered-by')

// Maintanance endpoints
expressApp.get('/health', (req, res) => {
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
const server = {
  get: (...args) => expressApp.get(...args),
  post: (...args) => expressApp.post(...args),
  put: (...args) => expressApp.put(...args),
  delete: (...args) => expressApp.delete(...args)
}

server.addHealthCheck = (func, message) => healthChecks.push({ func, message })

server.start = (port) => expressApp.listen(port, () =>
  logger.info(`Server listening on port ${port}`)
)

export default server
