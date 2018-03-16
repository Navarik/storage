import fs from 'fs'
import Database from 'nedb'

let client = null

const enforceArray = xs => (xs instanceof Array ? xs : [xs])

const databaseError = err => new Error(err)

const connect = (location = ':memory:') => new Promise((resolve, reject) => {
  client = new Database()
  resolve(client)
})

export const isConnected = () => client !== null

export const find = query => new Promise((resolve, reject) =>
  client.find(query, (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

export const insert = data => new Promise((resolve, reject) =>
  client.insert(enforceArray(data), (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

export const update = (query, data) => new Promise((resolve, reject) =>
  client.update(query, data, (err, res) => (err ? reject(databaseError(err)) : resolve(res)))
)

export const configure = (config) => connect(config.location)

export const close = () => client.close()
