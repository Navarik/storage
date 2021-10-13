import { NeDbSearchIndex } from "../index"

export class SubqueryOperator {
  private db: NeDbSearchIndex<any>

  constructor({ db }) {
    this.db = db
  }

  async compile([query]: Array<any>) {
    const references = await this.db.find(query)
    const ids =  references.map(x => x.id)

    return ids
  }
}
