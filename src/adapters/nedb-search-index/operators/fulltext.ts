import Database from '@navarik/nedb'
import { CanonicalEntity } from '../../../types'

const callback = (resolve, reject) => (err: Error, res) => {
  if (err) {
    reject(new Error(`[NeDB] Database error: ${err.message}`))
  } else {
    resolve(res)
  }
}

export class FulltextOperator {
  private db: Database

  constructor({ db }) {
    this.db = db
  }

  async compile([text]: Array<any>) {
    const found = await new Promise((resolve, reject) =>
      this.db.find(
        { text: { $regex: new RegExp(text, "i") } },
        callback(resolve, reject)
      )
    )

    const ids =  (<Array<CanonicalEntity<any, any>>>found).map(x => x.id)

    return {
      id: { $in: ids }
    }
  }
}
