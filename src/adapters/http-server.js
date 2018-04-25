import logger from 'logops'
import express from 'express'
import bodyParser from 'body-parser'
import expressLogging from 'express-logging'
import cors from 'cors'

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

server.start = (port) => server.listen(port, () =>
  logger.info(`Server listening on port ${port}`)
)

export default server
