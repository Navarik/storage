import { Transaction } from '../types'

export class PromiseTransaction implements Transaction<any> {
  public promise
  public resolve
  public reject

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
