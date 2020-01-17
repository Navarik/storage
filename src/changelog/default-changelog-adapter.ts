import { ChangelogAdapter, Observer, ChangeEvent } from '../types'

export class DefaultChangelogAdapter implements ChangelogAdapter {
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

  async init() {}

  isConnected() {
    return true
  }
}
