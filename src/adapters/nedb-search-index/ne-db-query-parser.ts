import { Dictionary } from '@navarik/types'
import { SearchQuery } from '../../types'
import { BinaryLogicOperator } from './operators/binary-logic'
import { ComparisonOperator } from './operators/comparison'
import { EqualityOperator } from './operators/equality'
import { NoopOperator } from './operators/noop'
import { RegexOperator } from './operators/regex'
import { SubqueryOperator } from './operators/subquery'
import { UnaryLogicOperator } from './operators/unary-logic'

export class NeDbQueryParser {
  private operators

  constructor({ db }) {
    this.operators = {
      noop: new NoopOperator(),
      and: new BinaryLogicOperator({ operator: "$and", root: this }),
      or: new BinaryLogicOperator({ operator: "$or", root: this }),
      in: new ComparisonOperator({ operator: "$in", root: this }),
      gt: new ComparisonOperator({ operator: "$gt", root: this }),
      lt: new ComparisonOperator({ operator: "$lt", root: this }),
      gte: new ComparisonOperator({ operator: "$gte", root: this }),
      lte: new ComparisonOperator({ operator: "$lte", root: this }),
      neq: new ComparisonOperator({ operator: "$ne", root: this }),
      eq: new EqualityOperator({ root: this }),
      not: new UnaryLogicOperator({ operator: "$not", root: this }),
      like: new RegexOperator(),
      subquery: new SubqueryOperator({ db })
    }
  }

  async parseFilter(query: SearchQuery): Promise<Dictionary<any>> {
    if (typeof query !== "object" || query === null || !query.operator) {
      return query
    }

    const operator = this.operators[query.operator]
    if (!operator) {
      throw new Error(`[NeDbSearchIndex] Query operator not implemented: "${query.operator}".`)
    }

    return await operator.compile(query.args)
  }

  /**
   * Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
   *    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
   *    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
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
