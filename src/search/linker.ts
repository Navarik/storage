import { Dictionary } from "@navarik/types"
import { ValidationError } from "../errors/validation-error"
import { SearchQuery, QueryLinker } from "../types"
import { FieldLinker } from "./term-linkers/field-linker"
import { NestedLinker } from "./term-linkers/nested-linker"
import { PassthroughLinker } from "./term-linkers/passthrough-linker"

export class Linker implements QueryLinker {
  private termLinkers: Dictionary<QueryLinker>

  constructor({ searchSchema }) {
    this.termLinkers = {
      "literal": new PassthroughLinker(),
      "noop": new PassthroughLinker(),
      "subquery": new PassthroughLinker(),
      "and": new NestedLinker({ rootLinker: this }),
      "or": new NestedLinker({ rootLinker: this }),
      "not": new NestedLinker({ rootLinker: this }),
      "eq": new FieldLinker({ searchSchema }),
      "in": new FieldLinker({ searchSchema }),
      "neq": new FieldLinker({ searchSchema }),
      "gt": new FieldLinker({ searchSchema }),
      "lt": new FieldLinker({ searchSchema }),
      "gte": new FieldLinker({ searchSchema }),
      "lte": new FieldLinker({ searchSchema }),
      "like": new FieldLinker({ searchSchema })
    }
  }

  link(query: SearchQuery) {
    if (typeof query !== "object" || query === null) {
      return query
    }

    const linker = this.termLinkers[query.operator]
    if (!linker) {
      throw new ValidationError(`Query term "${query.operator}" not recognized.`)
    }

    return linker.link(query)
  }
}
