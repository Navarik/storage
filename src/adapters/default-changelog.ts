import { Changelog, Observer, ChangeEvent } from '../types'

export class DefaultChangelog<M extends object> implements Changelog<M> {
  private observer?: Observer<any, M>
  private log: Array<ChangeEvent<any, M>>

  constructor(staticLog: Array<ChangeEvent<any, M>> = []) {
    this.observer = undefined
    this.log = [...staticLog]
  }

  observe<B extends object>(handler: Observer<B, M>) {
    this.observer = handler
  }

  async write<B extends object>(message: ChangeEvent<B, M>) {
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
