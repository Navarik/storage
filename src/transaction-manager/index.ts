import { Dictionary } from "../types"
import { Transaction } from "./types"
import { PromiseTransaction } from "./promise-transaction"

export * from "./types"

export class TransactionManager {
  private transactions: Dictionary<Transaction<any>>

  constructor() {
    this.transactions = {}
  }

  get<T>(key: string) {
    const transaction = <Transaction<T>>this.transactions[key]
    if (!transaction) {
      return undefined
    }

    return transaction.promise
  }

  commit<T>(key: string, data: any) {
    const transaction = <Transaction<T>>this.transactions[key]
    if (!transaction) {
      return false
    }

    transaction.commit(data)

    if (transaction.isDone) {
      delete this.transactions[key]
    }

    return true
  }

  reject<T>(key: string, message: any) {
    const transaction = <Transaction<T>>this.transactions[key]
    if (!transaction) {
      return false
    }

    transaction.reject(message)
    delete this.transactions[key]

    return true
  }

  start<T>(key: string, expectedCommits: number = 1) {
    const transaction = new PromiseTransaction<T>({ expectedCommits })
    this.transactions[key] = transaction

    return transaction.promise
  }

  expand<T>(key: string, commits: number) {
    const transaction = <Transaction<T>>this.transactions[key]
    if (!transaction) {
      return false
    }

    transaction.expand(commits)

    return true
  }
}
