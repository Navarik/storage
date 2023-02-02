import { Transaction } from "./types"

interface PromiseTransactionConfig {
  expectedCommits: number
}

export class PromiseTransaction<T> implements Transaction<T> {
  public promise: Promise<T|Array<T>>

  private remainingCommits: number
  private accumulator: Array<T>
  private resolvePromise?: (value: any) => void
  private rejectPromise?: (message: any) => void

  constructor({ expectedCommits }: PromiseTransactionConfig) {
    this.remainingCommits = expectedCommits
    this.accumulator = []

    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve
      this.rejectPromise = reject
    })
  }

  commit(data: T) {
    this.accumulator.push(data)
    this.remainingCommits--

    if (!this.remainingCommits && this.resolvePromise) {
      if (this.accumulator.length <= 1) {
        this.resolvePromise(this.accumulator[0])
      } else {
        this.resolvePromise(this.accumulator)
      }
    }
  }

  reject(message: any) {
    if (this.rejectPromise) {
      this.rejectPromise(message)
    }
  }

  get isDone() {
    return !this.remainingCommits
  }

  expand(commits: number) {
    this.remainingCommits += commits
  }
}
