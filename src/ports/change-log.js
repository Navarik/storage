//@flow
import uuidv5 from 'uuid/v5'
import arraySort from 'array-sort'

import type { ChangelogInterface, ChangeRecord, Identifier, ChangelogAdapterInterface, Observer } from '../flowtypes'

class ChangeLog implements ChangelogInterface {
  topic: string
  adapter: ChangelogAdapterInterface
  listener: ChangeRecord => void

  constructor(topic: string, adapter: ChangelogAdapterInterface) {
    this.adapter = adapter
    this.topic = topic
    this.listener = () => {}
  }

  onChange(func: ChangeRecord => void) {
    this.listener = func
  }

  async reconstruct() {
    let log = await this.adapter.read(this.topic)
    log = arraySort(log, 'version')

    return log
  }

  async register(document: ChangeRecord) {
    await this.adapter.write(this.topic, document)
    this.listener(document)

    return document
  }
}

export default ChangeLog
