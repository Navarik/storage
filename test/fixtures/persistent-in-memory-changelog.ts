import { ChangelogAdapter, Observer, ChangeEvent } from '../../src/types'

export class PersistentInMemoryChangelog<M extends object> implements ChangelogAdapter<M> {
  private observer?: Observer<any, M> = undefined
  private log: Array<ChangeEvent<any, M>> = []

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
    if (this.observer) {
      for (const event of this.log) {
        await this.observer(event)
      }
    }
  }

  async up() {}

  async down() {}

  async isHealthy() {
    return true
  }
}
