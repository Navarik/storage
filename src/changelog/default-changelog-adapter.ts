import { Dictionary } from '@navarik/types'
import { ChangelogAdapter, Observer, SignatureProvider, Entity } from '../types'

type AdapterConfig = {
  content?: Dictionary<Entity>
  signatureProvider: SignatureProvider
}

export class DefaultChangelogAdapter implements ChangelogAdapter<Entity> {
  private observer?: Observer<Entity>
  private log: Dictionary<Entity>
  private signatureProvider: SignatureProvider

  constructor({ content, signatureProvider }: AdapterConfig) {
    this.observer = undefined
    this.log = content || {}
    this.signatureProvider = signatureProvider
  }

  observe(handler: Observer<Entity>) {
    this.observer = handler
  }

  async write(message: Entity) {
    if (this.observer) {
      await this.observer(message)
    }
  }

  async init(types: string[]) {
    // This is a hack for allowing unit-testing and rare static data use-cases
    for (const type of types) {
      for (const data of Object.values(this.log[type] || {})) {
        const record = data.id ? data : this.signatureProvider.signNew({
          body: data,
          type,
          schema: ''
        })
        await this.write(record)
      }
    }
  }

  isConnected() {
    return true
  }
}
