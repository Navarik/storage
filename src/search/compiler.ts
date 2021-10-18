import { Dictionary } from "@navarik/types"
import { ValidationError } from "../errors/validation-error"
import { SearchQuery, QueryCompiler } from "../types"
import { FieldCompiler } from "./term-compilers/field-compiler"
import { NestedCompiler } from "./term-compilers/nested-compiler"
import { ObjectCompiler } from "./term-compilers/object-compiler"
import { PassthroughCompiler } from "./term-compilers/passthrough-compiler"

export class Compiler implements QueryCompiler<SearchQuery|Dictionary<any>> {
  private termCompilers: Dictionary<QueryCompiler<SearchQuery>>
  private objectCompiler: QueryCompiler<Dictionary<any>>

  constructor({ searchSchema }) {
    this.termCompilers = {
      "noop": new PassthroughCompiler(),
      "subquery": new PassthroughCompiler(),
      "fulltext": new PassthroughCompiler(),
      "and": new NestedCompiler({ rootCompiler: this }),
      "or": new NestedCompiler({ rootCompiler: this }),
      "not": new NestedCompiler({ rootCompiler: this }),
      "eq": new FieldCompiler({ searchSchema }),
      "in": new FieldCompiler({ searchSchema }),
      "neq": new FieldCompiler({ searchSchema }),
      "gt": new FieldCompiler({ searchSchema }),
      "lt": new FieldCompiler({ searchSchema }),
      "gte": new FieldCompiler({ searchSchema }),
      "lte": new FieldCompiler({ searchSchema }),
      "like": new FieldCompiler({ searchSchema })
    }
    this.objectCompiler = new ObjectCompiler({ searchSchema })
  }

  compile(query: SearchQuery|Dictionary<any>) {
    if (!query.operator) {
      return this.objectCompiler.compile(query)
    }

    const compiler = this.termCompilers[query.operator]
    if (!compiler) {
      throw new ValidationError(`Query term "${query.operator}" not recognized.`)
    }

    return compiler.compile(<SearchQuery>query)
  }
}
