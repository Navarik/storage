import fs from 'fs'
import { Database } from 'sqlite3'
import { splitName } from '../utils'

let client = null

const getFileNames = directory => fs.readdirSync(directory).map(fileName => `${directory}/${fileName}`)

const readAll = directories => directories
  .reduce((acc, directory) => acc.concat(getFileNames(directory)), [])
  .reduce((acc, fileName) => acc.concat(fs.readFileSync(fileName, 'utf8').replace(/\r?\n|\r/g, '').split(';')), [])
  .filter(x => x)

const connect = (location = ':memory:') => new Promise((resolve, reject) => {
  if (location !== ':memory:') {
    const { namespace } = splitName('/', location)

    if (!fs.existsSync(namespace)) {
      fs.mkdirSync(namespace)
    }
  }

  client = new Database(location, err => (err ? reject(err) : resolve(client)))
})

export const isConnected = () => client !== null

const databaseError = err => new Error(err)

export const query = ({ text, values }) => new Promise((resolve, reject) =>
  client.all(text, values, (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

export const exec = ({ text, values }) => new Promise((resolve, reject) =>
  client.run(text, values, function (err, res) {
    if (err) {
      reject(databaseError(err))
    } else {
      resolve(this.lastID)
    }
  })
)

export const configure = (config) =>
  connect(config.location)
    .then(() => readAll(config.migrations.split(',')).reduce(
      (chain, text) => chain.then(() => exec({ text, values: [] })),
      Promise.resolve()
    ))

export const close = () => client.close()
