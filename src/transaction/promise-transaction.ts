import { Transaction } from '../types'

export class PromiseTransaction<T> implements Transaction<T> {
  public promise: Promise<T>
  public resolve: (message: T) => any
  public reject: (error: Error) => any

  constructor() {
    this.resolve = () => {} // This is to make Typescript happy
    this.reject = () => {} // This is to make Typescript happy

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
