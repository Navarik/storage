import { Changelog, Observer, ChangeEvent } from '../types'

export class DefaultChangelog<B extends object, M extends object> implements Changelog<B, M> {
  private observer?: Observer<B, M>
  private log: Array<ChangeEvent<B, M>>

  constructor(staticLog: Array<ChangeEvent<B, M>> = []) {
    this.observer = undefined
    this.log = [...staticLog]
  }

  observe(handler: Observer<B, M>) {
    this.observer = handler
  }

  async write(message: ChangeEvent<B, M>) {
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
