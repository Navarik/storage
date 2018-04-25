import Database from 'nedb'

const enforceArray = xs => (xs instanceof Array ? xs : [xs])
const databaseError = err => new Error(err)
const promisify = func => (...args) => new Promise((resolve, reject) =>
  func(...args, (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

const createDatabase = () => {
  const client = new Database()

  const find = promisify((...args) => client.find(...args))
  const insert = promisify((...args) => client.insert(...args))
  const update = promisify((...args) => client.update(...args))

  return {
    find,
    findOne: query => find(query).then(xs => xs[0]),
    insert: data => insert(enforceArray(data)),
    update,
    close: () => client.close()
  }
}

export default createDatabase
