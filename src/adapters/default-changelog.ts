import { ChangelogAdapter, ChangeEvent } from '../types'

export class DefaultChangelogAdapter<M extends object> implements ChangelogAdapter<M> {
  private observer?: (change: ChangeEvent<any, M>) => Promise<void>
  private log: Array<ChangeEvent<any, M>>

  constructor(log: Array<ChangeEvent<any, M>> = []) {
    this.observer = undefined
    this.log = log
  }

  observe(handler: (change: ChangeEvent<any, M>) => Promise<void>) {
    this.observer = handler
  }

  async write(message: ChangeEvent<any, M>) {
    if (this.observer) {
      await this.observer(message)
    }
  }

  async readAll() {
    for (const event of this.log) {
      await this.write(event)
    }
  }

  async up() {}

  async down() {}

  async isHealthy() {
    return true
  }
}
