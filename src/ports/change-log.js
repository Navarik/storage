//@flow
import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

import type { IdGenerator, ChangelogInterface, ChangeRecord, Identifier, ChangelogAdapterInterface, Observer } from '../flowtypes'

type GenericChangeRecord = ChangeRecord<any>

class ChangeLog implements ChangelogInterface {
  topic: string
  generateId: IdGenerator
  adapter: ChangelogAdapterInterface
  listener: GenericChangeRecord => void

  constructor(topic: string, adapter: ChangelogAdapterInterface, generator: IdGenerator) {
    this.adapter = adapter
    this.topic = topic
    this.generateId = generator
    this.listener = () => {}
  }

  onChange(func: GenericChangeRecord => void) {
    this.listener = func
  }

  async reconstruct() {
    let log = await this.adapter.read(this.topic)
    log = arraySort(log, 'version')

    return log
  }

  async register(document: GenericChangeRecord): Promise<GenericChangeRecord> {
    await this.adapter.write(this.topic, document)
    this.listener(document)
  }
}

export default ChangeLog
