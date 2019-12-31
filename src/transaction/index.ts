import { PromiseTransaction } from './promise-transaction'
import { TransactionManager } from '../types'

export class LocalTransactionManager implements TransactionManager {
  private transactions

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
    const transaction = new PromiseTransaction()
    this.transactions[key] = transaction

    return transaction
  }
}
