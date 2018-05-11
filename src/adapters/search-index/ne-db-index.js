//@flow
import { head, exclude, map, maybe } from '../../utils'

import type { IndexInterface, Collection } from '../../flowtypes'

const format = maybe(exclude(['_id']))

class NeDbIndex implements IndexInterface {
  client: Object

  constructor(client: Object) {
    this.client = client
  }

  find(searchParams: Object) {
    return this.client.find(searchParams).then(map(format))
  }

  findOne(searchParams: Object) {
    return this.client.find(searchParams).then(head).then(format)
  }

  insert(documents: Collection) {
    return this.client.insert(documents)
  }

  update(searchParams: Object, document: Object) {
    return this.client
      .update(searchParams, document, { upsert: true, multi: true })
  }
}

export default NeDbIndex
