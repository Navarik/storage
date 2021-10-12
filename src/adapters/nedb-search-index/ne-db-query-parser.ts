import { Dictionary } from '@navarik/types'
import { NeDbSearchIndex } from '.'
import { SearchQuery } from '../../types'

type OperatorFactory = (args: Array<any>, db: NeDbSearchIndex<any>) => Promise<object|string>

const operators: Dictionary<OperatorFactory> = {
  literal: async ([value]) => value,
  and: async (args: Array<any>, db) => ({ $and: await Promise.all(args.map(x => parseTerm(x, db))) }),
  or: async (args: Array<any>, db) => ({ $or: await Promise.all(args.map(x => parseTerm(x, db))) }),
  eq: async ([field, value]: Array<any>, db) => ({ [field]: await parseTerm(value, db) }),
  in: async ([field, value]: Array<any>, db) => ({ [field]: { $in: await parseTerm(value, db) } }),
  gt: async ([field, value]: Array<any>, db) => ({ [field]: { $gt: await parseTerm(value, db) } }),
  lt: async ([field, value]: Array<any>, db) => ({ [field]: { $lt: await parseTerm(value, db) } }),
  gte: async ([field, value]: Array<any>, db) => ({ [field]: { $gte: await parseTerm(value, db) } }),
  lte: async ([field, value]: Array<any>, db) => ({ [field]: { $lte: await parseTerm(value, db) } }),
  neq: async (args: Array<any>, db) => ({ $not: await parseTerm({ operator: "eq", args }, db) }),
  not: async ([arg]: Array<any>, db) => ({ $not: await parseTerm(arg, db) }),
  like: async ([field, regex, options]: Array<any>, db) => ({ [field]: { $regex: new RegExp(regex, options) } }),
  subquery: async ([query], db) => {
    const references = await db.find(query)
    return references.map(x => x.id)
  },
  noop: async () => ({})
}

const parseTerm = async (term: any, db: NeDbSearchIndex<any>) => {
  if (typeof term !== "object" || term === null || !term.operator) {
    return term
  }

  const parseOperator = operators[term.operator]
  if (!parseOperator) {
    throw new Error(`[NeDbSearchIndex] Query operator not implemented: "${term.operator}."`)
  }

  return await parseOperator(term.args, db)
}

export class NeDbQueryParser {
  private db: NeDbSearchIndex<any>

  constructor({ db }) {
    this.db = db
  }

  async parseFilter(query: SearchQuery): Promise<Dictionary<any>> {
    return <Dictionary<any>>parseTerm(query, this.db)
  }

  /**
    * Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
    *    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
    *    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
   * @param {string
   * tring[]} sortQueries - A single sort query string or an array of sort query strings in descending priority:
   * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
   */
   parseSort(sortQueries: Array<string>): Dictionary<number> {
    const result: Dictionary<number> = {}
    for (const item of sortQueries) {
      const [field, order] = item.split(':')
      result[field] = (order || '').trim().toLowerCase() === 'desc' ? -1 : 1
    }

    return result
  }
}
