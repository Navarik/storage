//@flow
import map from 'poly-map'
import exclude from 'poly-exclude'
import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import flatten from 'array-flatten'
import sort from 'array-sort'
import groupBy from 'group-by'
import arraySort from 'array-sort'

type Iterable<T> = { [string|number]: T } | Array<T>

export { unique, diff, map, flatten, exclude, sort, groupBy, arraySort }

export const get = (name: string) => maybe((object: Object) => object[name])

export const maybe = f => x => (x === undefined ? undefined : f(x))

export const head = <T: any>(xs: Iterable<T>): ?T => {
  for (let x of xs) return x
}

export const enforceArra = x => (x instanceof Array ? x : [x])

type LiftToArray = <A: any|Array<any>, B: any|Array<any>>(f: A => B) => (A => B)
export const liftToArray: LiftToArray = (func) => x => (x instanceof Array ? map(func, x) : func(x))

export const identity = <T: any>(x: T): T => x
