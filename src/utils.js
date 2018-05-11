//@flow
import map from 'poly-map'
import exclude from 'poly-exclude'
import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import flatten from 'array-flatten'
import sort from 'array-sort'

type Iterable<T> = { [string|number]: T } | Array<T>

export { unique, diff, map, flatten, exclude, sort }

export const get = (name: string) => maybe((object: Object) => object[name])

export const maybe = f => x => (x === undefined ? undefined : f(x))

export const head = <T: any>(xs: Iterable<T>): ?T => {
  for (let x of xs) return x
}

type EnforceArray = <T: any>(x: T) => Array<T>
export const enforceArray: EnforceArray = x => (x instanceof Array ? x : [x])

export const liftToArray: LiftToArray = (func) => x => (x instanceof Array ? map(func, x) : func(x))

export const identity = <T: any>(x: T): T => x
