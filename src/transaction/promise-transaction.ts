export class PromiseTransaction<T> {
  public data: T
  public promise: Promise<T>
  public resolve: () => any
  public reject: (error: Error) => any

  constructor(data: T) {
    this.data = data
    this.resolve = () => {} // This is to make Typescript happy
    this.reject = () => {} // This is to make Typescript happy

    this.promise = new Promise((resolve, reject) => {
      this.resolve = () => resolve(this.data)
      this.reject = reject
    })
  }
}
