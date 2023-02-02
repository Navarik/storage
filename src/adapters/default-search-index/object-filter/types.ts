export type SearchOperator = "and"|"or"|"eq"|"in"|"neq"|"gt"|"lt"|"gte"|"lte"|"not"|"like"

export interface SearchQuery {
  operator: SearchOperator
  args: Array<any>
}

export type Filter<T extends object = object> = (data: T) => boolean

export interface FilterCompiler {
  compile: (query: SearchQuery) => Filter
}
