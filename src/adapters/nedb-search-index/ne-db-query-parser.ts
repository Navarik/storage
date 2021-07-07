import { Dictionary } from '@navarik/types'
import { SearchQuery } from '../../types'

type OperatorFactory = (args: Array<any>) => object|string

const operators: Dictionary<OperatorFactory> = {
  and: (args: Array<any>) => ({ $and: args.map(parseTerm) }),
  or: (args: Array<any>) => ({ $or: args.map(parseTerm) }),
  eq: ([field, value]: Array<any>) => ({ [field]: parseTerm(value) }),
  neq: (args: Array<any>) => ({ $not: parseTerm({ operator: "eq", args }) }),
  gt: ([field, value]: Array<any>) => ({ [field]: { $gt: parseTerm(value) } }),
  lt: ([field, value]: Array<any>) => ({ [field]: { $lt: parseTerm(value) } }),
  gte: ([field, value]: Array<any>) => ({ [field]: { $gte: parseTerm(value) } }),
  lte: ([field, value]: Array<any>) => ({ [field]: { $lte: parseTerm(value) } }),
  not: (args: Array<any>) => ({ $not: parseTerm(args[0]) }),
  like: ([field, regex, options]: Array<any>) => ({ [field]: { $regex: new RegExp(regex, options) } }),
  literal: (args: Array<any>) => {
    const value = parseTerm(args[0])
    return value instanceof Array ? { $in: value } : value
  }
}

const parseTerm = (term: SearchQuery) => {
  if (!term.operator) {
    return term
  }

  const parseOperator = operators[term.operator]
  if (!parseOperator) {
    throw new Error(`[NeDbSearchIndex] Query operator not implemented: ${term.operator}`)
  }

  return parseOperator(term.args)
}

export class NeDbQueryParser {
  parseFilter(query: SearchQuery): Dictionary<any> {
    return <Dictionary<any>>parseTerm(query)
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
