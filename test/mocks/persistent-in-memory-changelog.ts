import { ChangelogAdapter, ChangeEvent } from '../../src/types'

export class PersistentInMemoryChangelog<M extends object> implements ChangelogAdapter<M> {
  private observer?: (change: ChangeEvent<any, M>) => Promise<void> = undefined
  private log: Array<ChangeEvent<any, M>> = []

  observe(handler: (change: ChangeEvent<any, M>) => Promise<void>) {
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
