import Transaction from './transaction'

const transactions = {}

export const commit = (key, message) => {
  if (transactions[key]) {
    transactions[key].resolve(message)
    delete transactions[key]
  }
}

export const reject = (key, message) => {
  if (transactions[key]) {
    transactions[key].reject(message)
    delete transactions[key]
  }
}

export const start = (key) => {
  const transaction = new Transaction()
  transactions[key] = transaction

  return transaction
}
