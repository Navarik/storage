export interface Transaction<T> {
  promise: Promise<T|Array<T>>
  isDone: boolean
  commit(data: T): void
  reject(message: any): void
  expand(commits: number): void
}
