import { Dictionary } from '@navarik/types'
import { PromiseTransaction } from './promise-transaction'
import { TransactionManager, CanonicalEntity } from '../types'

export class LocalTransactionManager implements TransactionManager {
  private transactions: Dictionary<PromiseTransaction<CanonicalEntity>>

  constructor() {
    this.transactions = {}
  }

  commit(key: string) {
    const transaction = this.transactions[key]
    if (transaction) {
      transaction.resolve()
      delete this.transactions[key]
    }
  }

  reject(key: string, message: Error) {
    const transaction = this.transactions[key]
    if (transaction) {
      transaction.reject(message)
      delete this.transactions[key]
    }
  }

  start(key: string, data: CanonicalEntity) {
    const transaction = new PromiseTransaction(data)
    this.transactions[key] = transaction

    return transaction.promise
  }
}
