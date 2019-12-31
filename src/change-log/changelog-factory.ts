import { Factory, TransactionManager } from '../types'
import { DefaultChangelogAdapter } from './default-changelog-adapter'
import { UuidSignatureProvider } from './uuid-signature-provider'
import { ChangeLog } from './changelog'

type ChangelogFactoryConfig = {
  transactionManager: TransactionManager
}

export class ChangelogFactory implements Factory<ChangeLog> {
  private transactionManager: TransactionManager

  constructor({ transactionManager }: ChangelogFactoryConfig) {
    this.transactionManager = transactionManager
  }

  create({ adapter, idGenerator, content }) {
    return new ChangeLog({
      adapter: typeof adapter === 'object'
        ? adapter
        : new DefaultChangelogAdapter({ content, signatureProvider: new UuidSignatureProvider(idGenerator) }),
      signatureProvider: new UuidSignatureProvider(idGenerator),
      transactionManager: this.transactionManager
    })
  }
}
