const forever = require('forever-monitor')

const server = new (forever.Monitor)('dist/index.js', {
  max: 3,
  watch: false,
  args: [],
  env: {},
  cwd: __dirname + '/../'
})

process.on('SIGINT', () => {
  console.log('Exiting...')
  server.stop()
  process.exit()
})

process.on('SIGHUP', () => {
  console.log('Restarting...')
  server && server.stop()
  server.start()
})

server.start()
