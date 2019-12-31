import { Dictionary } from '@navarik/types'
import { ChangelogAdapter, Observer, CanonicalEntity, SignatureProvider } from '../types'

export class DefaultChangelogAdapter implements ChangelogAdapter {
  private observer: Observer
  private log: Dictionary<CanonicalEntity>
  signatureProvider: SignatureProvider

  constructor({ content, signatureProvider }) {
    this.observer = null
    this.log = content || {}
    this.signatureProvider = signatureProvider
  }

  observe(handler) {
    this.observer = handler
  }

  async write(message) {
    if (this.observer) {
      await this.observer(message)
    }
  }

  async init(types: string[]) {
    for (const type of types) {
      for (const data of Object.values(this.log[type] || {})) {
        const record = data.id ? data : this.signatureProvider.signNew(type, data)
        await this.write(record)
      }
    }
  }

  isConnected() {
    return true
  }
}
