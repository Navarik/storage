import { Dictionary } from '@navarik/types'
import { Factory, ClassOf, ChangelogAdapter, TransactionManager } from '../types'
import { DefaultChangelogAdapter } from './default-changelog-adapter'
import { UuidSignatureProvider } from './uuid-signature-provider'
import { ChangeLog } from './changelog'

type ChangelogFactoryConfig = {
  transactionManager: TransactionManager,
  adapters?: Dictionary<ClassOf<ChangelogAdapter>>
}

export class ChangelogFactory implements Factory<ChangeLog> {
  private transactionManager: TransactionManager
  private adapters: Dictionary<ClassOf<ChangelogAdapter>>

  constructor({ adapters = {}, transactionManager }: ChangelogFactoryConfig) {
    this.transactionManager = transactionManager
    this.adapters = {
      ...adapters,
      default: DefaultChangelogAdapter
    }
  }

  create(type: string, { idGenerator, content }) {
    const AdapterClass = this.adapters[type]
    if (!AdapterClass) {
      throw new Error(`[Storage] Unknown changelog type: ${type}`)
    }

    const adapter = new AdapterClass({
      content,
      signatureProvider: new UuidSignatureProvider(idGenerator)
    })

    return new ChangeLog({
      adapter: adapter,
      signatureProvider: new UuidSignatureProvider(idGenerator),
      transactionManager: this.transactionManager
    })
  }
}
