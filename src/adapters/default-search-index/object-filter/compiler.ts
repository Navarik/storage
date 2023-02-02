import { SearchQuery, Filter, FilterCompiler } from './types'
import { EqOperator } from './operators/eq'
import { NeqOperator } from './operators/neq'
import { LikeOperator } from './operators/like'
import { AndOperator } from './operators/and'
import { OrOperator } from './operators/or'
import { NotOperator } from './operators/not'
import { GtOperator } from './operators/gt'
import { LtOperator } from './operators/lt'
import { GteOperator } from './operators/gte'
import { LteOperator } from './operators/lte'
import { InOperator } from './operators/in'
import { FulltextOperator } from './operators/fulltext'
import { EmptyOperator } from './operators/empty'

export class Compiler implements FilterCompiler {
  private operators = {
    and: new AndOperator(this),
    or: new OrOperator(this),
    not: new NotOperator(this),
    eq: new EqOperator(),
    neq: new NeqOperator(),
    empty: new EmptyOperator(),
    gt: new GtOperator(),
    lt: new LtOperator(),
    gte: new GteOperator(),
    lte: new LteOperator(),
    in: new InOperator(this),
    like: new LikeOperator(),
    fulltext: new FulltextOperator()
  }

  addOperator(operator: string, strategy: FilterCompiler) {
    this.operators[operator] = strategy
  }

  compile(query: SearchQuery): Filter {
    if (!query.operator) {
      throw new Error(`[ObjectFilter] Malformed query: ${JSON.stringify(query)}`)
    }

    const operator = this.operators[query.operator]
    if (!operator) {
      throw new Error(`[ObjectFilter] Query operator not implemented: ${query.operator}`)
    }

    return operator.compile(query)
  }
}
