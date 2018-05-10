import map from 'poly-map'
import exclude from 'poly-exclude'
import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import flatten from 'array-flatten'
import sort from 'array-sort'

export const get = name => object => object[name]
export const head = xs => xs && Object.values(xs)[0]
export const maybe = f => x => (x === undefined ? undefined : f(x))
export const enforceArray = x => (x instanceof Array ? x : [x])
export const liftToArray = func => x => (x instanceof Array ? map(func, x) : func(x))

export { unique, diff, map, flatten, exclude, sort }
