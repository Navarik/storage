import bunyan from 'bunyan'
import packageJson from '../package'

const logger = bunyan.createLogger({
  name: packageJson.name,
  level: process.env.LOG_LEVEL || 'info'
})

export default logger
