import { ChangelogAdapter, Observer, ChangeEvent } from '../types'

export class DefaultChangelogAdapter<M extends object> implements ChangelogAdapter<M> {
  private observer?: Observer<any, M>
  private log: Array<ChangeEvent<any, M>>

  constructor() {
    this.observer = undefined
    this.log = []
  }

  observe<B extends object>(handler: Observer<B, M>) {
    this.observer = handler
  }

  async write<B extends object>(message: ChangeEvent<B, M>) {
    this.log.push(message)
    if (this.observer) {
      await this.observer(message)
    }
  }

  async readAll() {
    for (const event of this.log) {
      this.write(event)
    }
  }

  async up() {}

  async down() {}

  async isHealthy() {
    return true
  }
}
