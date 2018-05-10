//@flow
import { head } from '../../utils'

import type { IndexInterface, Collection } from '../../flowtypes'

class InMemoryIndex implements IndexInterface {
  client: Object

  constructor(client: Object) {
    this.client = client
  }

  find(searchParams: Object) {
    return this.client.find(searchParams)
  }

  findOne(searchParams: Object) {
    return this.client.find(searchParams).then(head)
  }

  insert(documents: Collection) {
    return this.client.insert(documents)
  }

  update(searchParams: Object, document: Object) {
    return this.client.update(searchParams, document, { upsert: true, multi: true })
  }
}

export default InMemoryIndex
