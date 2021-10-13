import Database from '@navarik/nedb'
import { CanonicalEntity } from '../../../types'

const callback = (resolve, reject) => (err: Error, res) => {
  if (err) {
    reject(new Error(`[NeDB] Database error: ${err.message}`))
  } else {
    resolve(res)
  }
}

export class SubqueryOperator {
  private root
  private db: Database

  constructor({ db, root }) {
    this.db = db
    this.root = root
  }

  async compile([query]: Array<any>) {
    const filter = await this.root.parseFilter(query)
    const references = new Promise((resolve, reject) => this.db.find(filter, callback(resolve, reject)))

    const ids =  (<Array<CanonicalEntity<any, any>>>await references).map(x => x.id)

    return ids
  }
}
