import { PromiseTransaction } from './promise-transaction'
import { TransactionManager, Transaction, CanonicalEntity } from '../types'
import { Dictionary } from '@navarik/types'

export class LocalTransactionManager implements TransactionManager {
  private transactions: Dictionary<Transaction<CanonicalEntity>>

  constructor() {
    this.transactions = {}
  }

  commit(key: string, message: CanonicalEntity) {
    const transaction = this.transactions[key]
    if (transaction) {
      transaction.resolve(message)
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

  start(key: string) {
    const transaction = new PromiseTransaction<CanonicalEntity>()
    this.transactions[key] = transaction

    return transaction
  }
}
