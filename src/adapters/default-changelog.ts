import { Changelog, Observer, ChangeEvent } from '../types'

export class DefaultChangelog implements Changelog {
  private observer?: Observer
  private log: Array<ChangeEvent>

  constructor(staticLog: Array<ChangeEvent> = []) {
    this.observer = undefined
    this.log = [...staticLog]
  }

  observe(handler: Observer) {
    this.observer = handler
  }

  async write(message: ChangeEvent) {
    if (this.observer) {
      await this.observer(message)
    }
  }

  async reset() {
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
