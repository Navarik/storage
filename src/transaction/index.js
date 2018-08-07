import Transaction from './transaction'

class TransactionManager {
  constructor() {
    this.transactions = {}
  }

  commit(key, message) {
    if (this.transactions[key]) {
      this.transactions[key].resolve(message)
      delete this.transactions[key]
    }
  }

  reject(key, message) {
    if (this.transactions[key]) {
      this.transactions[key].reject(message)
      delete this.transactions[key]
    }
  }

  start(key) {
    const transaction = new Transaction()
    this.transactions[key] = transaction

    return transaction
  }
}

export default TransactionManager
