import { SearchQuery } from "../../types"

export type Filter<T extends object = object> = (data: T) => boolean

export interface FilterCompiler {
  compile: (query: SearchQuery) => Filter
}
